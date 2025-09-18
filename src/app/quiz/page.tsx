'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UpgradeModal from '@/components/UpgradeModal';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  performance: 'excellent' | 'good' | 'needs_improvement';
  results: Array<{
    questionId: number;
    question: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export default function QuizPage() {
  const MATH_UNITS = {
    '中学1年': ['正負の数', '文字と式', '一次方程式', '比例と反比例', '平面図形', '空間図形', 'データの活用'],
    '中学2年': ['式の計算', '連立方程式', '一次関数', '図形の性質', '図形の証明', '確率'],
    '中学3年': ['展開と因数分解', '平方根', '二次方程式', '二次関数', '相似', '三平方の定理', '標本調査'],
    '高校1年': ['数と式', '集合と命題', '二次関数', '図形と計量', 'データの分析'],
    '高校2年': ['式と証明', '複素数と方程式', '図形と方程式', '三角関数', '指数関数と対数関数'],
    '高校3年': ['極限', '微分法', '積分法', '数列', 'ベクトル', '確率分布と統計的な推測']
  };

  const ENGLISH_UNITS = {
    '中学1年': ['be動詞', '一般動詞', '疑問文', '否定文', '複数形', '代名詞'],
    '中学2年': ['過去形', '未来形', '助動詞', '不定詞', '動名詞', '比較'],
    '中学3年': ['現在完了', '受動態', '関係代名詞', '間接疑問文', '分詞'],
    '高校1年': ['文型', '時制', '助動詞', '仮定法', '不定詞', '動名詞'],
    '高校2年': ['分詞', '関係詞', '比較', '仮定法', '語法'],
    '高校3年': ['長文読解', '英作文', '語彙', 'リスニング', '文法総合']
  };

  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [quizState, setQuizState] = useState<'setup' | 'active' | 'completed' | 'review'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [unit, setUnit] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleStartQuiz = async () => {
    if (!subject || !grade || !unit || !difficulty) {
      alert('すべての項目を選択してください');
      return;
    }

    if (difficulty === '応用' && user?.plan !== 'plus') {
      setShowUpgradeModal(true);
      return;
    }

    setGenerating(true);
    
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          level: difficulty, 
          subject, 
          grade, 
          unit, 
          questionCount 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setQuizId(data.quizId);
        setQuizState('active');
        setCurrentQuestion(0);
        setAnswers([]);
      } else {
        const errorData = await response.json();
        if (errorData.feature === 'quiz-advanced') {
          setShowUpgradeModal(true);
        } else {
          alert('クイズの開始に失敗しました');
        }
      }
    } catch (error) {
      console.error('Quiz start error:', error);
      alert('エラーが発生しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitQuiz(newAnswers);
    }
  };

  const handleSubmitQuiz = async (finalAnswers?: number[]) => {
    const answersToSubmit = finalAnswers || answers;
    
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quizId, 
          answers: answersToSubmit, 
          questions 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setQuizState('completed');
      } else {
        alert('採点に失敗しました');
      }
    } catch (error) {
      console.error('Quiz submit error:', error);
      alert('エラーが発生しました');
    }
  };

  const resetQuiz = () => {
    setQuizState('setup');
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
    setQuizId(null);
    setSubject('');
    setGrade('');
    setUnit('');
    setDifficulty('');
  };

  const showReview = () => {
    setQuizState('review');
  };

  const backToResults = () => {
    setQuizState('completed');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">小テスト</h1>
        
        {quizState === 'setup' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">小テスト設定</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  教科
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setGrade('');
                    setUnit('');
                    setDifficulty('');
                  }}
                >
                  <option value="">教科を選択</option>
                  <option value="数学">数学</option>
                  <option value="英語">英語</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学年
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setUnit('');
                    setDifficulty('');
                  }}
                  disabled={!subject}
                >
                  <option value="">学年を選択</option>
                  {subject === '数学' && (
                    <>
                      <option value="中学1年">中学1年</option>
                      <option value="中学2年">中学2年</option>
                      <option value="中学3年">中学3年</option>
                      <option value="高校1年">高校1年</option>
                      <option value="高校2年">高校2年</option>
                      <option value="高校3年">高校3年</option>
                    </>
                  )}
                  {subject === '英語' && (
                    <>
                      <option value="中学1年">中学1年</option>
                      <option value="中学2年">中学2年</option>
                      <option value="中学3年">中学3年</option>
                      <option value="高校1年">高校1年</option>
                      <option value="高校2年">高校2年</option>
                      <option value="高校3年">高校3年</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  単元
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value);
                    setDifficulty('');
                  }}
                  disabled={!grade}
                >
                  <option value="">単元を選択</option>
                  {subject === '数学' && grade && MATH_UNITS[grade as keyof typeof MATH_UNITS]?.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                  {subject === '英語' && grade && ENGLISH_UNITS[grade as keyof typeof ENGLISH_UNITS]?.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  難易度
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={!unit}
                >
                  <option value="">難易度を選択</option>
                  <option value="基礎">基礎</option>
                  <option value="標準">標準</option>
                  <option value="応用">
                    応用 {user?.plan !== 'plus' && '(PLUS限定)'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  問題数
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                >
                  <option value={5}>5問</option>
                  <option value={10}>10問</option>
                  <option value={15}>15問</option>
                </select>
              </div>

              <button
                onClick={handleStartQuiz}
                disabled={generating || !subject || !grade || !unit || !difficulty}
                className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  generating || !subject || !grade || !unit || !difficulty
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {generating 
                  ? '問題生成中...' 
                  : 'クイズ開始'
                }
              </button>
            </div>
          </div>
        )}

        {quizState === 'active' && questions.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">
                問題 {currentQuestion + 1} / {questions.length}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {questions[currentQuestion].question}
              </h3>
              
              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {quizState === 'completed' && result && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">結果発表</h2>
            
            <div className="text-center mb-6">
              <div className={`text-4xl font-bold mb-2 ${
                result.performance === 'excellent' ? 'text-green-600' :
                result.performance === 'good' ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {result.score}点
              </div>
              <div className="text-gray-600">
                {result.correctCount} / {result.totalQuestions} 問正解
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-2">パフォーマンス</h4>
              <div className={`text-sm ${
                result.performance === 'excellent' ? 'text-green-600' :
                result.performance === 'good' ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {result.performance === 'excellent' && '素晴らしい！完璧な理解度です。'}
                {result.performance === 'good' && '良い結果です！基本は理解できています。'}
                {result.performance === 'needs_improvement' && '復習が必要です。基礎から見直しましょう。'}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={showReview}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
              >
                解答と解説を確認
              </button>
              <button
                onClick={resetQuiz}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700"
              >
                もう一度挑戦
              </button>
            </div>
          </div>
        )}

        {quizState === 'review' && result && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">解答と解説</h2>
              <button
                onClick={backToResults}
                className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                結果に戻る
              </button>
            </div>
            
            <div className="space-y-6">
              {result.results.map((questionResult, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">問題 {index + 1}</h3>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        questionResult.isCorrect 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {questionResult.isCorrect ? '正解' : '不正解'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{questionResult.question}</p>
                    
                    <div className="space-y-2">
                      {questionResult.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded border ${
                            optionIndex === questionResult.correctAnswer
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : optionIndex === questionResult.userAnswer && !questionResult.isCorrect
                              ? 'bg-red-50 border-red-200 text-red-800'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span>{option}</span>
                            {optionIndex === questionResult.correctAnswer && (
                              <span className="ml-auto text-green-600 font-medium">正解</span>
                            )}
                            {optionIndex === questionResult.userAnswer && optionIndex !== questionResult.correctAnswer && (
                              <span className="ml-auto text-red-600 font-medium">あなたの回答</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-medium text-blue-900 mb-2">解説</h4>
                    <p className="text-blue-800 text-sm">{questionResult.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={resetQuiz}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700"
              >
                新しいクイズに挑戦
              </button>
            </div>
          </div>
        )}
      </div>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        reason="feature_locked"
      />
    </Layout>
  );
}
