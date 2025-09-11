'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

interface Passkey {
  id: string;
  code: string;
  planType: 'basic' | 'premium';
  maxUses: number;
  currentUses: number;
  expiresAt: string | null;
  createdAt: string;
  isExpired: boolean;
  isFullyUsed: boolean;
}

export default function PasskeyPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'redeem' | 'generate'>('redeem');

  const [generateForm, setGenerateForm] = useState({
    planType: 'basic' as 'basic' | 'premium',
    maxUses: 1,
    expiresAt: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, passkeysResponse] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/passkey?action=list')
        ]);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        if (passkeysResponse.ok) {
          const passkeysData = await passkeysResponse.json();
          setPasskeys(passkeysData.passkeys || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!redeemCode.trim()) {
      alert('パスキーコードを入力してください');
      return;
    }

    setRedeeming(true);
    try {
      const response = await fetch('/api/passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem',
          code: redeemCode.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`成功！${data.newPlan === 'plus' ? 'PLUS' : 'FREE'}プランにアップグレードしました`);
        setRedeemCode('');
        
        const userResponse = await fetch('/api/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }
      } else {
        alert(data.error || 'パスキーの使用に失敗しました');
      }
    } catch (error) {
      console.error('Redeem error:', error);
      alert('エラーが発生しました');
    } finally {
      setRedeeming(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setGenerating(true);
    try {
      const response = await fetch('/api/passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          planType: generateForm.planType,
          maxUses: generateForm.maxUses,
          expiresAt: generateForm.expiresAt || null
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`パスキーを生成しました: ${data.passkey.code}`);
        
        const passkeysResponse = await fetch('/api/passkey?action=list');
        if (passkeysResponse.ok) {
          const passkeysData = await passkeysResponse.json();
          setPasskeys(passkeysData.passkeys || []);
        }
        
        setGenerateForm({
          planType: 'basic',
          maxUses: 1,
          expiresAt: ''
        });
      } else {
        alert(data.error || 'パスキーの生成に失敗しました');
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('エラーが発生しました');
    } finally {
      setGenerating(false);
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">パスキー管理</h1>
        
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('redeem')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'redeem'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                パスキー使用
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'generate'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                パスキー生成
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'redeem' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">パスキーを使用</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    パスキーコードを入力してプランをアップグレードできます。
                  </p>
                  
                  <form onSubmit={handleRedeem} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        パスキーコード
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例: ABC12345"
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        maxLength={16}
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={redeeming}
                      className={`w-full py-3 px-4 rounded-md font-medium ${
                        redeeming
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {redeeming ? '処理中...' : 'パスキーを使用'}
                    </button>
                  </form>
                </div>

                {user && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">現在のプラン</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.plan === 'plus' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.plan === 'plus' ? 'PLUS' : 'FREE'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'generate' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">パスキー生成</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    新しいパスキーを生成できます。生成されたパスキーは他のユーザーと共有できます。
                  </p>
                  
                  <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        プランタイプ
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={generateForm.planType}
                        onChange={(e) => setGenerateForm(prev => ({ 
                          ...prev, 
                          planType: e.target.value as 'basic' | 'premium' 
                        }))}
                      >
                        <option value="basic">Basic (FREE)</option>
                        <option value="premium">Premium (PLUS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最大使用回数
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={generateForm.maxUses}
                        onChange={(e) => setGenerateForm(prev => ({ 
                          ...prev, 
                          maxUses: parseInt(e.target.value) || 1 
                        }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        有効期限（任意）
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={generateForm.expiresAt}
                        onChange={(e) => setGenerateForm(prev => ({ 
                          ...prev, 
                          expiresAt: e.target.value 
                        }))}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={generating}
                      className={`w-full py-3 px-4 rounded-md font-medium ${
                        generating
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {generating ? '生成中...' : 'パスキーを生成'}
                    </button>
                  </form>
                </div>

                {passkeys.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">生成済みパスキー</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              コード
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              タイプ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              使用状況
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              状態
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {passkeys.map((passkey) => (
                            <tr key={passkey.id}>
                              <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                                {passkey.code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  passkey.planType === 'premium' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {passkey.planType === 'premium' ? 'Premium' : 'Basic'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {passkey.currentUses} / {passkey.maxUses}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  passkey.isExpired || passkey.isFullyUsed
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {passkey.isExpired ? '期限切れ' : 
                                   passkey.isFullyUsed ? '使用済み' : '有効'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
