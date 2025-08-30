'use client';

import React from 'react';

export default function PlanComparison() {
  const features = [
    {
      name: '教材生成',
      free: '1日10回まで + 広告視聴',
      plus: '無制限 + 広告なし'
    },
    {
      name: 'ソリューションナビ',
      free: '1日3回まで',
      plus: '無制限'
    },
    {
      name: 'AIサポート5本柱',
      free: 'ナビのみ',
      plus: '全機能解放'
    },
    {
      name: '小テスト',
      free: '基礎・標準のみ',
      plus: '応用・入試レベル含む'
    },
    {
      name: 'カレンダー機能',
      free: '閲覧のみ',
      plus: '編集・予約可能'
    },
    {
      name: '学習レポート',
      free: '基本統計のみ',
      plus: '弱点分析・月次PDF'
    },
    {
      name: 'サポート',
      free: 'コミュニティ',
      plus: '優先サポート'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">プラン比較</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">機能</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                <div className="flex flex-col items-center">
                  <span>FREE</span>
                  <span className="text-lg font-bold text-gray-900">¥0</span>
                </div>
              </th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                <div className="flex flex-col items-center">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
                    PLUS
                  </span>
                  <span className="text-lg font-bold text-purple-600">¥1,500/月</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {features.map((feature, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {feature.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-center">
                  {feature.free}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className="text-purple-600 font-medium">
                    {feature.plus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            今すぐアップグレードして、すべての機能をお楽しみください
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>いつでもキャンセル可能</span>
            <span>•</span>
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>即座に機能解放</span>
          </div>
        </div>
      </div>
    </div>
  );
}
