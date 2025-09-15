'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import AdModal from '@/components/AdModal';
import UpgradeModal from '@/components/UpgradeModal';
import { pdf } from '@react-pdf/renderer';
import PDFDocument from '@/components/PDFDocument';

export default function GeneratorPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAd, setShowAd] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    subject: string;
    grade: string;
    unit: string;
    difficulty: string;
    problems: Array<{
      question: string;
      answer: string;
      explanation: string;
    }>;
  } | null>(null);
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [unit, setUnit] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [limits, setLimits] = useState<{
    gen_left: number;
    navi_left: number;
    today: string;
    unlimited?: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let response = await fetch('/api/me');
        
        if (!response.ok && response.status === 401) {
          console.log('Initial auth check failed, retrying after 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          response = await fetch('/api/me');
        }
        
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
    if (!subject || !grade || !unit || !difficulty) {
      alert('すべての項目を選択してください');
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
        body: JSON.stringify({ subject, grade, unit, difficulty }),
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

  const handleViewPDF = async () => {
    if (!result) return;
    
    const blob = await pdf(
      <PDFDocument
        title={result.title}
        subject={result.subject}
        grade={result.grade}
        unit={result.unit}
        difficulty={result.difficulty}
        problems={result.problems}
      />
    ).toBlob();
    
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    
    const blob = await pdf(
      <PDFDocument
        title={result.title}
        subject={result.subject}
        grade={result.grade}
        unit={result.unit}
        difficulty={result.difficulty}
        problems={result.problems}
      />
    ).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.title}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
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
                教科
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setGrade('');
                  setUnit('');
                  setDifficulty('');
                }}
              >
                <option value="">教科を選択</option>
                <option value="数学">数学</option>
                <option value="英語">英語</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学年
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setUnit('');
                  setDifficulty('');
                }}
                disabled={!subject}
              >
                <option value="">学年を選択</option>
                {subject === '数学' && (
                  <>
                    <option value="中学1年">中学1年</option>
                    <option value="中学2年">中学2年</option>
                    <option value="中学3年">中学3年</option>
                    <option value="高校1年">高校1年</option>
                    <option value="高校2年">高校2年</option>
                    <option value="高校3年">高校3年</option>
                  </>
                )}
                {subject === '英語' && (
                  <>
                    <option value="中学1年">中学1年</option>
                    <option value="中学2年">中学2年</option>
                    <option value="中学3年">中学3年</option>
                    <option value="高校1年">高校1年</option>
                    <option value="高校2年">高校2年</option>
                    <option value="高校3年">高校3年</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                単元
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setDifficulty('');
                }}
                disabled={!grade}
              >
                <option value="">単元を選択</option>
                {subject === '数学' && grade && (
                  <>
                    <option value="方程式">方程式</option>
                    <option value="関数">関数</option>
                    <option value="図形">図形</option>
                    <option value="確率">確率</option>
                  </>
                )}
                {subject === '英語' && grade && (
                  <>
                    <option value="文法">文法</option>
                    <option value="読解">読解</option>
                    <option value="語彙">語彙</option>
                    <option value="作文">作文</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                難易度
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={!unit}
              >
                <option value="">難易度を選択</option>
                <option value="基礎">基礎</option>
                <option value="標準">標準</option>
                <option value="応用">応用</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !subject || !grade || !unit || !difficulty || (user?.plan === 'free' && (limits?.gen_left ?? 0) <= 0)}
              className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                generating || !subject || !grade || !unit || !difficulty || (user?.plan === 'free' && (limits?.gen_left ?? 0) <= 0)
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
                  <p className="text-sm text-gray-600 mt-1">
                    {result.subject} | {result.grade} | {result.unit} | {result.difficulty}
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={handleViewPDF}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    PDFを表示
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    PDFをダウンロード
                  </button>
                </div>
                
                {result.problems && result.problems.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-medium text-gray-900 mb-4">プレビュー</h5>
                    {result.problems.map((problem, index) => (
                      <div key={index} className="bg-white p-4 rounded border mb-4">
                        <div className="mb-3">
                          <h6 className="font-medium text-gray-900 mb-2">問題 {index + 1}</h6>
                          <p className="text-gray-700">{problem.question}</p>
                        </div>
                        <div className="mb-3">
                          <h6 className="font-medium text-gray-900 mb-2">解答</h6>
                          <p className="text-gray-700">{problem.answer}</p>
                        </div>
                        <div>
                          <h6 className="font-medium text-gray-900 mb-2">解説</h6>
                          <p className="text-gray-700">{problem.explanation}</p>
                        </div>
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
