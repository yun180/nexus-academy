'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UpgradeModal from '@/components/UpgradeModal';

export default function QuizPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
      const response = await fetch('/api/quiz/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });

      if (response.ok) {
        await response.json();
        alert(`${level}レベルのテストを開始します（実装予定）`);
      } else {
        setShowUpgradeModal(true);
      }
    } catch (error) {
      console.error('Level access error:', error);
      alert('エラーが発生しました');
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">小テスト</h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {quizLevels.map((level) => (
              <div
                key={level.id}
                className={`p-6 rounded-lg border-2 ${
                  level.available
                    ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer'
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
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {level.available ? 'テスト開始' : 'PLUS限定'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        reason="feature_locked"
      />
    </Layout>
  );
}
