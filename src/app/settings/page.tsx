'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PlanComparison from '@/components/PlanComparison';

export default function SettingsPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus'; displayName: string; paidUntil?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

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

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/settings?success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(error.error || 'アップグレードに失敗しました');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('エラーが発生しました');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="設定">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="設定">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* プラン情報 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">プラン情報</h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">
                {user?.plan === 'plus' ? 'NEXUS ACADEMY PLUS' : 'NEXUS ACADEMY (FREE)'}
              </h3>
              <p className="text-sm text-gray-600">
                {user?.plan === 'plus' 
                  ? `次回更新日: ${user.paidUntil ? new Date(user.paidUntil).toLocaleDateString('ja-JP') : '未設定'}`
                  : '無料プランをご利用中です'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {user?.plan === 'plus' ? '¥1,500/月' : '¥0'}
              </div>
              {user?.plan === 'free' && (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className={`mt-2 px-4 py-2 rounded-md font-medium ${
                    upgrading
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  }`}
                >
                  {upgrading ? 'アップグレード中...' : 'PLUSにアップグレード'}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* プラン比較 */}
        {user?.plan === 'free' && (
          <PlanComparison />
        )}

        {/* アカウント情報 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">アカウント情報</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                表示名
              </label>
              <input
                type="text"
                value={user?.displayName || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                LINEアカウントの表示名が使用されます
              </p>
            </div>
          </div>
        </div>

        {/* 使用状況 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">今日の使用状況</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">教材生成</h3>
              <div className="text-2xl font-bold text-blue-600">
                0 / {user?.plan === 'plus' ? '∞' : '10'}
              </div>
              <p className="text-sm text-gray-600">回</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">ソリューションナビ</h3>
              <div className="text-2xl font-bold text-green-600">
                0 / {user?.plan === 'plus' ? '∞' : '3'}
              </div>
              <p className="text-sm text-gray-600">回</p>
            </div>
          </div>
        </div>

        {/* その他設定 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">その他</h2>
          
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-medium text-gray-900">通知設定</div>
              <div className="text-sm text-gray-600">プッシュ通知の設定を変更</div>
            </button>
            
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-medium text-gray-900">利用規約</div>
              <div className="text-sm text-gray-600">サービス利用規約を確認</div>
            </button>
            
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-medium text-gray-900">プライバシーポリシー</div>
              <div className="text-sm text-gray-600">個人情報の取り扱いについて</div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
