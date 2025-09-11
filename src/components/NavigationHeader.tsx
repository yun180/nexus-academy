'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PlanBadge from './PlanBadge';

interface NavigationHeaderProps {
  user?: {
    displayName: string;
    plan: 'free' | 'plus';
  } | null;
}

export default function NavigationHeader({ user }: NavigationHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const tabs = [
    { key: 'home', label: 'ホーム', path: '/home' },
    { key: 'support', label: '学習サポート', path: '/ai' },
    { key: 'classroom', label: '授業', path: '/classroom' },
  ];

  const getInitials = (name: string) => {
    return name.charAt(0);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900">学習システム</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{user.displayName}さん</span>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {getInitials(user.displayName)}
                  </button>
                </div>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {getInitials(user.displayName)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <PlanBadge plan={user.plan} />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        alert('プロフィール編集機能は実装予定です');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      プロフィール編集
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/settings');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      設定
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        alert('ログアウト機能は実装予定です');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => router.push(tab.path)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                pathname === tab.path
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
