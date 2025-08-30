'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import AdModal from '@/components/AdModal';
import UpgradeModal from '@/components/UpgradeModal';

export default function GeneratorPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAd, setShowAd] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    content: string;
    difficulty: string;
    questions?: Array<{
      question: string;
      options: string[];
      correct: number;
    }>;
  } | null>(null);
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState('基礎');
  const [limits, setLimits] = useState<{
    gen_left: number;
    navi_left: number;
    today: string;
    unlimited?: boolean;
  } | null>(null);

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

    const fetchLimits = async () => {
      try {
        const response = await fetch('/api/limits');
        if (response.ok) {
          const limitsData = await response.json();
          setLimits(limitsData);
        }
      } catch (error) {
        console.error('Failed to fetch limits:', error);
      }
    };

    fetchUser();
    fetchLimits();
  }, []);

  const handleGenerate = async () => {
    if (!content.trim()) {
      alert('学習内容を入力してください');
      return;
    }

    if (user?.plan === 'free') {
      if (limits && limits.gen_left <= 0) {
        setShowUpgradeModal(true);
        return;
      }
      setShowAd(true);
    } else {
      await startGeneration();
    }
  };

  const handleAdComplete = async () => {
    setShowAd(false);
    await startGeneration();
  };

  const startGeneration = async () => {
    setGenerating(true);
    setResult(null);

    try {
      const incrementResponse = await fetch('/api/usage/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gen' }),
      });

      if (!incrementResponse.ok) {
        const error = await incrementResponse.json();
        alert(error.error || '生成に失敗しました');
        return;
      }

      const generateResponse = await fetch('/api/generate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, difficulty }),
      });

      if (!generateResponse.ok) {
        alert('生成の開始に失敗しました');
        return;
      }

      const { jobId } = await generateResponse.json();
      
      const checkStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/generate/status?jobId=${jobId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed') {
            setResult(statusData.result);
            setGenerating(false);
            
            const limitsResponse = await fetch('/api/limits');
            if (limitsResponse.ok) {
              const limitsData = await limitsResponse.json();
              setLimits(limitsData);
            }
          } else {
            setTimeout(checkStatus, 1000);
          }
        } catch (error) {
          console.error('Status check error:', error);
          setGenerating(false);
        }
      };

      setTimeout(checkStatus, 2000);
    } catch (error) {
      console.error('Generation error:', error);
      setGenerating(false);
      alert('生成中にエラーが発生しました');
    }
  };

  if (loading) {
    return (
      <Layout title="教材生成">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="教材生成">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI教材生成</h2>
          
          {user?.plan === 'free' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">FREE版制限</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>• 1日10回まで生成可能 {limits && `(残り${limits.gen_left}回)`}</p>
                    <p>• 生成前に5秒の広告視聴が必要</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学習内容
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="生成したい教材の内容を入力してください..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                難易度
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option>基礎</option>
                <option>標準</option>
                <option>応用</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || (user?.plan === 'free' && (limits?.gen_left ?? 0) <= 0)}
              className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                generating || (user?.plan === 'free' && (limits?.gen_left ?? 0) <= 0)
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {generating 
                ? '生成中...' 
                : user?.plan === 'free' 
                  ? (limits?.gen_left ?? 0) <= 0 
                    ? '本日の上限に達しました'
                    : '広告視聴後に生成開始' 
                  : '教材生成開始'
              }
            </button>
          </div>

          {result && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">生成完了</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{result.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">難易度: {result.difficulty}</p>
                </div>
                <div>
                  <p className="text-gray-700">{result.content}</p>
                </div>
                {result.questions && result.questions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">練習問題</h5>
                    {result.questions.map((q, index: number) => (
                      <div key={index} className="bg-white p-4 rounded border">
                        <p className="font-medium mb-2">{q.question}</p>
                        <ul className="space-y-1">
                          {q.options.map((option: string, optIndex: number) => (
                            <li key={optIndex} className={`text-sm ${optIndex === q.correct ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                              {optIndex === q.correct ? '✓ ' : '• '}{option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AdModal isOpen={showAd} onComplete={handleAdComplete} />
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        reason="generation_limit"
      />
    </Layout>
  );
}
