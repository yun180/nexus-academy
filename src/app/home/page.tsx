'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UsageCard from '@/components/UsageCard';

export default function HomePage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [limits, setLimits] = useState<{
    gen_left: number;
    navi_left: number;
    today: string;
    unlimited?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, limitsResponse] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/limits')
        ]);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        if (limitsResponse.ok) {
          const limitsData = await limitsResponse.json();
          setLimits(limitsData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const genUsed = limits ? (user?.plan === 'plus' ? 0 : 10 - limits.gen_left) : 0;
  const naviUsed = limits ? (user?.plan === 'plus' ? 0 : 3 - limits.navi_left) : 0;

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">ホーム</h1>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">無料開放分</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UsageCard
              title="AIチャット"
              current={naviUsed}
              max={3}
              color="blue"
              unlimited={user?.plan === 'plus'}
            />
            <UsageCard
              title="問題生成"
              current={genUsed}
              max={10}
              color="green"
              unlimited={user?.plan === 'plus'}
            />
            <UsageCard
              title="小テスト"
              current={2}
              max={5}
              color="purple"
              unlimited={user?.plan === 'plus'}
            />
            <UsageCard
              title="教材レコメンド"
              current={1}
              max={3}
              color="orange"
              unlimited={user?.plan === 'plus'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AIチャット</h3>
            <p className="text-gray-600 mb-4">数学・英語の質問にAIが答えます</p>
            <p className="text-sm text-gray-500 mb-4">残り利用回数: {limits?.unlimited ? '無制限' : `${limits?.navi_left || 0}回`}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${limits?.unlimited ? 100 : ((3 - (limits?.navi_left || 0)) / 3) * 100}%` }} />
            </div>
            <button 
              onClick={() => window.location.href = '/ai'}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600"
            >
              開始する
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">問題生成</h3>
            <p className="text-gray-600 mb-4">AIが学習レベルに合わせた問題を作成</p>
            <p className="text-sm text-gray-500 mb-4">残り利用回数: {limits?.unlimited ? '無制限' : `${limits?.gen_left || 0}回`}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${limits?.unlimited ? 100 : ((10 - (limits?.gen_left || 0)) / 10) * 100}%` }} />
            </div>
            <button 
              onClick={() => window.location.href = '/generator'}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600"
            >
              開始する
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">小テスト</h3>
            <p className="text-gray-600 mb-4">基礎から応用まで段階的にテスト</p>
            <p className="text-sm text-gray-500 mb-4">残り利用回数: {user?.plan === 'plus' ? '無制限' : '2回'}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${user?.plan === 'plus' ? 100 : 40}%` }} />
            </div>
            <button 
              onClick={() => window.location.href = '/quiz'}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-600"
            >
              開始する
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">教材レコメンド</h3>
            <p className="text-gray-600 mb-4">苦手分野に合わせた教材を推薦</p>
            <p className="text-sm text-gray-500 mb-4">残り利用回数: {user?.plan === 'plus' ? '無制限' : '1回'}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${user?.plan === 'plus' ? 100 : 33}%` }} />
            </div>
            <button 
              onClick={() => window.location.href = '/material-recommend'}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600"
            >
              開始する
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
