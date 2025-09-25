'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

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
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [questionImagePreview, setQuestionImagePreview] = useState<string>('');
  const [expectedAnswerImagePreview, setExpectedAnswerImagePreview] = useState<string>('');
  const [handwrittenAnswerImagePreview, setHandwrittenAnswerImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    subject: '数学',
    questionImage: null as File | null,
    expectedAnswerImage: null as File | null,
    handwrittenAnswerImage: null as File | null
  });

  const subjects = ['数学', '英語', '国語', '理科', '社会'];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyResponse = await fetch('/api/answer-checker');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData.history || []);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };

    fetchHistory();
  }, []);

  const handleImageChange = (type: 'question' | 'expectedAnswer' | 'handwrittenAnswer') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'question') {
          setFormData(prev => ({ ...prev, questionImage: file }));
          setQuestionImagePreview(result);
        } else if (type === 'expectedAnswer') {
          setFormData(prev => ({ ...prev, expectedAnswerImage: file }));
          setExpectedAnswerImagePreview(result);
        } else if (type === 'handwrittenAnswer') {
          setFormData(prev => ({ ...prev, handwrittenAnswerImage: file }));
          setHandwrittenAnswerImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.handwrittenAnswerImage || !formData.expectedAnswerImage) {
      alert('手書き答案画像と模範解答画像をアップロードしてください');
      return;
    }

    setChecking(true);
    try {
      const submitData = new FormData();
      submitData.append('handwrittenAnswerImage', formData.handwrittenAnswerImage);
      submitData.append('expectedAnswerImage', formData.expectedAnswerImage);
      submitData.append('subject', formData.subject);
      if (formData.questionImage) {
        submitData.append('questionImage', formData.questionImage);
      }

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
      questionImage: null,
      expectedAnswerImage: null,
      handwrittenAnswerImage: null
    });
    setQuestionImagePreview('');
    setExpectedAnswerImagePreview('');
    setHandwrittenAnswerImagePreview('');
    setResult(null);
  };


  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">アンサーチェッカー</h1>
        
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
                  問題画像（任意）
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={handleImageChange('question')}
                />
                {questionImagePreview && (
                  <div className="mt-4">
                    <img
                      src={questionImagePreview}
                      alt="問題画像プレビュー"
                      className="max-w-full h-48 object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模範解答画像
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={handleImageChange('expectedAnswer')}
                  required
                />
                {expectedAnswerImagePreview && (
                  <div className="mt-4">
                    <img
                      src={expectedAnswerImagePreview}
                      alt="模範解答画像プレビュー"
                      className="max-w-full h-48 object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手書き答案画像
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={handleImageChange('handwrittenAnswer')}
                  required
                />
                {handwrittenAnswerImagePreview && (
                  <div className="mt-4">
                    <img
                      src={handwrittenAnswerImagePreview}
                      alt="手書き答案画像プレビュー"
                      className="max-w-full h-48 object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={checking}
                  className={`flex-1 py-3 px-4 rounded-md font-medium ${
                    checking
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
    </Layout>
  );
}
