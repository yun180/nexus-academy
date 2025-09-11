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
  correctAnswers: number;
  totalQuestions: number;
  weakAreas: string[];
  performance: 'excellent' | 'good' | 'needs_improvement';
}

export default function ChallengePage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [quizState, setQuizState] = useState<'setup' | 'active' | 'completed'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: number; answer: number; isCorrect: boolean; topic: string }>>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizId, setQuizId] = useState<string>('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const [formData, setFormData] = useState({
    difficulty: '初級',
    subject: '数学',
    questionCount: 5
  });

  const difficulties = ['初級', '中級', '上級'];
  const subjects = ['数学', '英語', '国語', '理科', '社会'];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          
          if (userData.plan !== 'plus') {
            setShowUpgradeModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizState === 'active' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (quizState === 'active' && timeLeft === 0) {
      handleSubmitQuiz();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizState]);

  const startQuiz = async () => {
    if (user?.plan !== 'plus') {
      setShowUpgradeModal(true);
      return;
    }

    try {
      const response = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setQuizId(data.quizId);
        setTimeLeft(data.timeLimit);
        setStartTime(Date.now());
        setQuizState('active');
        setCurrentQuestion(0);
        setAnswers([]);
      } else {
        const error = await response.json();
        alert(error.error || 'クイズの開始に失敗しました');
      }
    } catch (error) {
      console.error('Start quiz error:', error);
      alert('エラーが発生しました');
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const question = questions[currentQuestion];
    const isCorrect = answerIndex === question.correct;
    
    setAnswers(prev => [...prev, {
      questionId: question.id,
      answer: answerIndex,
      isCorrect,
      topic: formData.subject
    }]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    try {
      const response = await fetch('/api/challenge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          answers,
          timeSpent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setQuizState('completed');
      } else {
        alert('結果の保存に失敗しました');
      }
    } catch (error) {
      console.error('Submit quiz error:', error);
      alert('エラーが発生しました');
    }
  };

  const resetQuiz = () => {
    setQuizState('setup');
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <h1 className="text-2xl font-bold text-gray-900">チャレンジマッチ</h1>
        
        {user?.plan !== 'plus' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">PLUS限定機能</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  チャレンジマッチはPLUS会員限定の機能です。アップグレードしてAI小テストを体験しましょう。
                </p>
              </div>
            </div>
          </div>
        )}

        {quizState === 'setup' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">クイズ設定</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  難易度
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  科目
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  問題数
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.questionCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                >
                  <option value={5}>5問</option>
                  <option value={10}>10問</option>
                  <option value={15}>15問</option>
                </select>
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={user?.plan !== 'plus'}
              className={`mt-6 w-full py-3 px-4 rounded-md font-medium ${
                user?.plan !== 'plus'
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              チャレンジ開始
            </button>
          </div>
        )}

        {quizState === 'active' && questions.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">
                問題 {currentQuestion + 1} / {questions.length}
              </div>
              <div className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                残り時間: {formatTime(timeLeft)}
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
                {result.correctAnswers} / {result.totalQuestions} 問正解
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">パフォーマンス</h4>
                <div className={`text-sm ${
                  result.performance === 'excellent' ? 'text-green-600' :
                  result.performance === 'good' ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {result.performance === 'excellent' && '素晴らしい！'}
                  {result.performance === 'good' && '良い結果です！'}
                  {result.performance === 'needs_improvement' && '復習が必要です'}
                </div>
              </div>

              {result.weakAreas.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">苦手分野</h4>
                  <div className="text-sm text-gray-600">
                    {result.weakAreas.join(', ')}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={resetQuiz}
              className="w-full py-3 px-4 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700"
            >
              もう一度挑戦
            </button>
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
