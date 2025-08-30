'use client';

import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'generation_limit' | 'navigation_limit' | 'feature_locked';
}

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/settings?success=true`,
          cancelUrl: `${window.location.origin}${window.location.pathname}`,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert('アップグレードに失敗しました');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('エラーが発生しました');
    }
  };

  const getContent = () => {
    switch (reason) {
      case 'generation_limit':
        return {
          title: '本日の生成回数上限に達しました',
          description: 'FREE版では1日10回まで教材生成が可能です。無制限で利用するにはPLUSにアップグレードしてください。',
          benefits: ['教材生成無制限', '広告なし', 'AIサポート5本柱フル解放']
        };
      case 'navigation_limit':
        return {
          title: '本日のナビ利用回数上限に達しました',
          description: 'FREE版では1日3回までソリューションナビが利用可能です。無制限で利用するにはPLUSにアップグレードしてください。',
          benefits: ['ソリューションナビ無制限', '全AIサポート機能', '弱点分析レポート']
        };
      case 'feature_locked':
        return {
          title: 'この機能はPLUS限定です',
          description: 'この機能をご利用いただくには、NEXUS ACADEMY PLUSへのアップグレードが必要です。',
          benefits: ['AIサポート5本柱フル解放', '応用レベル小テスト', 'カレンダー編集機能']
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {content.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {content.description}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">NEXUS ACADEMY PLUSの特典</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {content.benefits.map((benefit, index) => (
                <li key={index}>• {benefit}</li>
              ))}
            </ul>
            <div className="mt-3 text-lg font-bold text-purple-600">
              月額¥1,500
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              後で
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 font-medium"
            >
              今すぐアップグレード
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
