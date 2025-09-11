'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UpgradeModal from '@/components/UpgradeModal';

interface CheckResult {
  checkId: string;
  ocrResult: {
    text: string;
    confidence: number;
  };
  analysis: {
    score: number;
    feedback: string[];
    correctParts: string[];
    incorrectParts: string[];
  };
}

interface HistoryItem {
  id: string;
  subject: string;
  topic: string;
  score: number;
  completedAt: string;
  weakAreas: string[] | { incorrectParts: string[] } | null;
}

export default function AnswerCheckerPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    subject: '数学',
    questionText: '',
    expectedAnswer: '',
    image: null as File | null
  });

  const subjects = ['数学', '英語', '国語', '理科', '社会'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, historyResponse] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/answer-checker')
        ]);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          if (userData.plan !== 'plus') {
            setShowUpgradeModal(true);
          }
        }

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData.history || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user?.plan !== 'plus') {
      setShowUpgradeModal(true);
      return;
    }

    if (!formData.image || !formData.expectedAnswer) {
      alert('画像と模範解答を入力してください');
      return;
    }

    setChecking(true);
    try {
      const submitData = new FormData();
      submitData.append('image', formData.image);
      submitData.append('expectedAnswer', formData.expectedAnswer);
      submitData.append('subject', formData.subject);
      submitData.append('questionText', formData.questionText);

      const response = await fetch('/api/answer-checker', {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        
        const historyResponse = await fetch('/api/answer-checker');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData.history || []);
        }
      } else {
        const error = await response.json();
        alert(error.error || '採点に失敗しました');
      }
    } catch (error) {
      console.error('Answer check error:', error);
      alert('エラーが発生しました');
    } finally {
      setChecking(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '数学',
      questionText: '',
      expectedAnswer: '',
      image: null
    });
    setImagePreview('');
    setResult(null);
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
        <h1 className="text-2xl font-bold text-gray-900">アンサーチェッカー</h1>
        
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
                  アンサーチェッカーはPLUS会員限定の機能です。手書き答案の自動採点を体験しましょう。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">答案アップロード</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  科目
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  問題文（任意）
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="問題文を入力してください"
                  value={formData.questionText}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模範解答
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={4}
                  placeholder="模範解答を入力してください"
                  value={formData.expectedAnswer}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedAnswer: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手書き答案画像
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={handleImageChange}
                  required
                />
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="答案プレビュー"
                      className="max-w-full h-48 object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={checking || user?.plan !== 'plus'}
                  className={`flex-1 py-3 px-4 rounded-md font-medium ${
                    checking || user?.plan !== 'plus'
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {checking ? '採点中...' : '採点開始'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  リセット
                </button>
              </div>
            </form>
          </div>

          {result && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">採点結果</h2>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    result.analysis.score >= 80 ? 'text-green-600' :
                    result.analysis.score >= 60 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {result.analysis.score}点
                  </div>
                  <div className="text-sm text-gray-600">
                    OCR信頼度: {Math.round(result.ocrResult.confidence * 100)}%
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">認識されたテキスト</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {result.ocrResult.text || '（テキストが認識されませんでした）'}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">フィードバック</h4>
                  <ul className="space-y-1">
                    {result.analysis.feedback.map((feedback, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {feedback}
                      </li>
                    ))}
                  </ul>
                </div>

                {result.analysis.correctParts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">正解部分</h4>
                    <div className="text-sm text-green-600">
                      {result.analysis.correctParts.join(', ')}
                    </div>
                  </div>
                )}

                {result.analysis.incorrectParts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">要確認部分</h4>
                    <div className="text-sm text-red-600">
                      {result.analysis.incorrectParts.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">採点履歴</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      科目
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      問題
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      得点
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日時
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.topic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.score >= 80 ? 'bg-green-100 text-green-800' :
                          item.score >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.score}点
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.completedAt).toLocaleDateString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
