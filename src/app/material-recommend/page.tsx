'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UpgradeModal from '@/components/UpgradeModal';

interface MaterialRecommendation {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  description: string;
  url: string;
  reason: string;
}

export default function MaterialRecommendPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [recommendations, setRecommendations] = useState<MaterialRecommendation[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, []);

  const generateRecommendations = async () => {
    if (user?.plan !== 'plus') {
      setShowUpgradeModal(true);
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/material-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        const error = await response.json();
        alert(error.error || 'レコメンド生成に失敗しました');
      }
    } catch (error) {
      console.error('Recommendation error:', error);
      alert('エラーが発生しました');
    } finally {
      setAnalyzing(false);
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
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">教材レコメンド</h1>
        
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
                  教材レコメンドはPLUS会員限定の機能です。学習履歴を分析して最適な教材を推薦します。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">AI教材レコメンド</h2>
          <p className="text-gray-600 mb-6">
            あなたの学習履歴と苦手分野を分析して、最適な教材を推薦します。
          </p>
          
          <button
            onClick={generateRecommendations}
            disabled={analyzing || user?.plan !== 'plus'}
            className={`py-3 px-6 rounded-md font-medium ${
              analyzing || user?.plan !== 'plus'
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {analyzing ? 'レコメンド生成中...' : '教材レコメンドを生成'}
          </button>
        </div>

        {recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900">{rec.title}</h3>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                    {rec.subject}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{rec.description}</p>
                
                <div className="text-xs text-gray-500 mb-4">
                  推薦理由: {rec.reason}
                </div>
                
                <button
                  onClick={() => window.open(rec.url, '_blank')}
                  className="w-full py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  教材を見る
                </button>
              </div>
            ))}
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
