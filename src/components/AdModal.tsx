'use client';

import React, { useState, useEffect } from 'react';

interface AdModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function AdModal({ isOpen, onComplete }: AdModalProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onComplete, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              スポンサー広告
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              FREE版では教材生成前に広告の視聴が必要です
            </p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <div className="text-2xl font-bold text-gray-800 mb-2">
              広告プレースホルダ
            </div>
            <p className="text-sm text-gray-600">
              ここに実際の広告が表示されます
            </p>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              {countdown > 0 ? `${countdown}秒後にスキップ可能` : '広告完了'}
            </div>
          </div>
          
          {countdown === 0 && (
            <div className="mt-4">
              <div className="text-sm text-green-600 font-medium">
                ✓ 広告視聴完了 - 教材生成を開始します
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
