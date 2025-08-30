'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function AIPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleFeatureClick = async (featureId: string) => {
    try {
      const response = await fetch('/api/ai/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId }),
      });

      if (response.ok) {
        await response.json();
        if (featureId === 'solution-navi') {
          alert('ソリューションナビを開始します（実装予定）');
        } else {
          alert(`${featureId}を開始します（実装予定）`);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'アクセスが拒否されました');
      }
    } catch (error) {
      console.error('Feature access error:', error);
      alert('エラーが発生しました');
    }
  };

  if (loading) {
    return (
      <Layout title="AIサポート5本柱">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const aiFeatures = [
    {
      id: 'solution-navi',
      name: 'ソリューションナビ',
      description: '問題解決のための最適なアプローチを提案',
      available: true,
      dailyLimit: user?.plan === 'free' ? '1日3回まで' : '無制限',
    },
    {
      id: 'goal-planner',
      name: 'ゴールプランナー',
      description: '学習目標の設定と達成計画を作成',
      available: user?.plan === 'plus',
      dailyLimit: user?.plan === 'plus' ? '無制限' : 'PLUS限定',
    },
    {
      id: 'challenge-match',
      name: 'チャレンジマッチ',
      description: 'レベルに応じた挑戦課題をマッチング',
      available: user?.plan === 'plus',
      dailyLimit: user?.plan === 'plus' ? '無制限' : 'PLUS限定',
    },
    {
      id: 'learning-pick',
      name: 'ラーニングピック',
      description: '個人に最適化された学習コンテンツを選択',
      available: user?.plan === 'plus',
      dailyLimit: user?.plan === 'plus' ? '無制限' : 'PLUS限定',
    },
    {
      id: 'answer-checker',
      name: 'アンサーチェッカー',
      description: '回答の正確性と改善点を詳細分析',
      available: user?.plan === 'plus',
      dailyLimit: user?.plan === 'plus' ? '無制限' : 'PLUS限定',
    },
  ];

  return (
    <Layout title="AIサポート5本柱">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AIサポート5本柱</h2>
          
          {user?.plan === 'free' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">FREE版では制限があります</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>ソリューションナビのみご利用いただけます。全機能をご利用いただくにはPLUSにアップグレードしてください。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {aiFeatures.map((feature) => (
              <div
                key={feature.id}
                className={`p-6 rounded-lg border-2 ${
                  feature.available
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.name}
                  </h3>
                  {!feature.available && (
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {feature.description}
                </p>
                
                <div className="text-xs text-gray-500 mb-4">
                  {feature.dailyLimit}
                </div>
                
                <button
                  disabled={!feature.available}
                  onClick={() => handleFeatureClick(feature.id)}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    feature.available
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {feature.available ? '利用開始' : 'PLUSにアップグレード'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
