'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function ClassroomPage() {
  const [, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
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

  if (loading) {
    return (
      <Layout title="オンライン教室">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="オンライン教室">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">オンライン教室</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                オンライン授業・個別指導
              </h3>
              <p className="text-gray-600 mb-4">
                専門講師によるリアルタイム授業と個別指導セッション
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">グループ授業</h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• 少人数制クラス（最大8名）</li>
                <li>• 双方向コミュニケーション</li>
                <li>• 録画視聴可能</li>
                <li>• 質疑応答セッション</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium">
                授業を予約
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">個別指導</h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• マンツーマン指導</li>
                <li>• カスタマイズされたカリキュラム</li>
                <li>• 弱点克服に特化</li>
                <li>• 進捗管理とフィードバック</li>
              </ul>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium">
                個別指導を予約
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">今後の授業予定</h3>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">予約された授業はありません</p>
              <p className="text-sm text-gray-400 mt-2">上記のボタンから授業を予約してください</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
