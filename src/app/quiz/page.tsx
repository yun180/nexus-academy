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
  performance: 'excellent' | 'good' | 'needs_improvement';
}

export default function QuizPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [quizState, setQuizState] = useState<'setup' | 'active' | 'completed'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: number; answer: number; isCorrect: boolean }>>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

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

  const handleLevelClick = async (level: string) => {
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, subject: '数学', questionCount: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setQuizState('active');
        setCurrentQuestion(0);
        setAnswers([]);
      } else {
        setShowUpgradeModal(true);
      }
    } catch (error) {
      console.error('Quiz start error:', error);
      alert('エラーが発生しました');
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const question = questions[currentQuestion];
    const isCorrect = answerIndex === question.correct;
    
    setAnswers(prev => [...prev, {
      questionId: question.id,
      answer: answerIndex,
      isCorrect
    }]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    setResult({
      score,
      correctAnswers,
      totalQuestions: questions.length,
      performance: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs_improvement'
    });
    setQuizState('completed');
  };

  const resetQuiz = () => {
    setQuizState('setup');
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
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

  const quizLevels = [
    { id: 'basic', name: '基礎', available: true },
    { id: 'standard', name: '標準', available: true },
    { id: 'advanced', name: '応用', available: user?.plan === 'plus' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">小テスト</h1>
        
        {quizState === 'setup' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">レベル選択</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              {quizLevels.map((level) => (
                <div
                  key={level.id}
                  className={`p-6 rounded-lg border-2 ${
                    level.available
                      ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {level.name}
                  </h3>
                  {!level.available && (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      PLUS限定
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    {level.id === 'basic' && '基本的な問題を解いて理解度をチェック'}
                    {level.id === 'standard' && '標準的な問題で実力を確認'}
                    {level.id === 'advanced' && '応用問題で深い理解度を測定'}
                  </p>
                  <button
                    disabled={!level.available}
                    onClick={() => handleLevelClick(level.id)}
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                      level.available
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {level.available ? 'テスト開始' : 'PLUS限定'}
                  </button>
                </div>
              ))}
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
                {result.correctAnswers} / {result.totalQuestions} 問正解
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
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
