'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UpgradeModal from '@/components/UpgradeModal';

export default function AIPage() {
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
        setShowUpgradeModal(true);
      }
    } catch (error) {
      console.error('Feature access error:', error);
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
    <Layout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">学習サポート</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ソリューションナビ</h3>
            <p className="text-gray-600 mb-6">AIチャットで疑問解決</p>
            <button
              onClick={() => handleFeatureClick('solution-navi')}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600"
            >
              開始する
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ゴールプランナー</h3>
            <p className="text-gray-600 mb-6">学習カレンダーを自動生成</p>
            <button
              onClick={() => handleFeatureClick('goal-planner')}
              disabled={user?.plan !== 'plus'}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                user?.plan === 'plus'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              開始する
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">チャレンジマッチ</h3>
            <p className="text-gray-600 mb-6">AI小テスト機能</p>
            <button
              onClick={() => handleFeatureClick('challenge-match')}
              disabled={user?.plan !== 'plus'}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                user?.plan === 'plus'
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              開始する
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">アンサーチェッカー</h3>
            <p className="text-gray-600 mb-6">手書き答案の自動採点</p>
            <button
              onClick={() => handleFeatureClick('answer-checker')}
              disabled={user?.plan !== 'plus'}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                user?.plan === 'plus'
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              開始する
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ラーニングピック</h3>
            <p className="text-gray-600 mb-6">苦手単元を分析し教材レコメンド</p>
            <button
              onClick={() => handleFeatureClick('learning-pick')}
              disabled={user?.plan !== 'plus'}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                user?.plan === 'plus'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              開始する
            </button>
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
