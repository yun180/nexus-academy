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
    spreadsheetUrl?: string;
    documentUrl?: string;
  } | null>(null);
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [unit, setUnit] = useState('');
  const [difficulty, setDifficulty] = useState('');

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

    fetchUser();
  }, []);

  const handleGenerate = async () => {
    if (!subject || !grade || !unit || !difficulty) {
      alert('すべての項目を選択してください');
      return;
    }

    await startGeneration();
  };

  const handleAdComplete = async () => {
    setShowAd(false);
    await startGeneration();
  };

  const startGeneration = async () => {
    setGenerating(true);
    setResult(null);

    try {
      const generateResponse = await fetch('/api/generate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, grade, unit, difficulty }),
      });

      if (!generateResponse.ok) {
        alert('生成の開始に失敗しました');
        return;
      }

      const responseData = await generateResponse.json();
      
      if (responseData.status === 'completed') {
        setResult(responseData.result);
      } else {
        alert('生成中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('生成中にエラーが発生しました');
    } finally {
      setGenerating(false);
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
              disabled={generating || !subject || !grade || !unit || !difficulty}
              className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                generating || !subject || !grade || !unit || !difficulty
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {generating 
                ? '生成中...' 
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
                
                <div className="flex flex-wrap gap-4">
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
                  {result.spreadsheetUrl && (
                    <a
                      href={result.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      スプレッドシートで開く
                    </a>
                  )}
                  {result.documentUrl && (
                    <a
                      href={result.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      ドキュメントで開く
                    </a>
                  )}
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
