'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UpgradeModal from '@/components/UpgradeModal';

interface SubjectAnalysis {
  subject: string;
  averageScore: number;
  recentAverageScore: number;
  totalAttempts: number;
  weakAreas: string[];
  trend: 'improving' | 'declining' | 'stable';
  needsAttention: boolean;
}

interface Recommendation {
  type: 'urgent' | 'warning' | 'advancement' | 'specific' | 'general';
  subject: string;
  title: string;
  description: string;
  actions: string[];
  priority: 'high' | 'medium' | 'low';
}

interface LearningSummary {
  subject: string;
  attemptCount: number;
  averageScore: number;
  lastAttempt: string;
}

export default function LearningPickPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SubjectAnalysis[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<LearningSummary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, summaryResponse] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/learning-pick')
        ]);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          if (userData.plan !== 'plus') {
            setShowUpgradeModal(true);
          }
        }

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData.summary || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const runAnalysis = async () => {
    if (user?.plan !== 'plus') {
      setShowUpgradeModal(true);
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/learning-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis || []);
        setRecommendations(data.recommendations || []);
      } else {
        const error = await response.json();
        alert(error.error || '分析に失敗しました');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('エラーが発生しました');
    } finally {
      setAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <span className="text-green-500">↗️</span>;
      case 'declining':
        return <span className="text-red-500">↘️</span>;
      default:
        return <span className="text-gray-500">→</span>;
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
        <h1 className="text-2xl font-bold text-gray-900">ラーニングピック</h1>
        
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
                  ラーニングピックはPLUS会員限定の機能です。学習履歴を分析して最適な教材をレコメンドします。
                </p>
              </div>
            </div>
          </div>
        )}

        {summary.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">学習状況サマリー（過去30日）</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.map((item) => (
                <div key={item.subject} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">{item.subject}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-gray-600">
                      取り組み回数: {item.attemptCount}回
                    </div>
                    <div className="text-sm text-gray-600">
                      平均点: {item.averageScore}点
                    </div>
                    <div className="text-sm text-gray-600">
                      最終学習: {new Date(item.lastAttempt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={runAnalysis}
                disabled={analyzing || user?.plan !== 'plus'}
                className={`py-3 px-6 rounded-md font-medium ${
                  analyzing || user?.plan !== 'plus'
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {analyzing ? '分析中...' : 'AI分析を実行'}
              </button>
            </div>
          </div>
        )}

        {analysis.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">学習分析結果</h2>
            
            <div className="space-y-4">
              {analysis.map((subject, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  subject.needsAttention ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        {subject.subject}
                        {getTrendIcon(subject.trend)}
                        {subject.needsAttention && (
                          <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            要注意
                          </span>
                        )}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">平均点:</span>
                          <span className="ml-1 font-medium">{subject.averageScore}点</span>
                        </div>
                        <div>
                          <span className="text-gray-600">最近の平均:</span>
                          <span className="ml-1 font-medium">{subject.recentAverageScore}点</span>
                        </div>
                        <div>
                          <span className="text-gray-600">取り組み回数:</span>
                          <span className="ml-1 font-medium">{subject.totalAttempts}回</span>
                        </div>
                        <div>
                          <span className="text-gray-600">傾向:</span>
                          <span className="ml-1 font-medium">
                            {subject.trend === 'improving' ? '向上中' :
                             subject.trend === 'declining' ? '下降気味' : '安定'}
                          </span>
                        </div>
                      </div>
                      {subject.weakAreas.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">苦手分野:</span>
                          <span className="ml-1 text-sm text-red-600">
                            {subject.weakAreas.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">学習レコメンド</h2>
            
            <div className="space-y-6">
              {recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium">{rec.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                      {rec.subject}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-4">{rec.description}</p>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">推奨アクション:</h4>
                    <ul className="text-sm space-y-1">
                      {rec.actions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.length === 0 && !analyzing && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">学習データがありません</h3>
            <p className="text-gray-600 mb-4">
              クイズやチャレンジマッチに取り組んで学習データを蓄積しましょう。
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.href = '/quiz'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                小テストを始める
              </button>
              <button
                onClick={() => window.location.href = '/challenge'}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                チャレンジマッチ
              </button>
            </div>
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
