'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      getIDToken: () => string;
      login: (options?: { redirectUri?: string }) => void;
      logout: () => void;
      getProfile: () => Promise<{
        userId: string;
        displayName: string;
        pictureUrl?: string;
        statusMessage?: string;
      }>;
    };
  }
}

type DiagnosticStage = 'init' | 'loading-sdk' | 'sdk-loaded' | 'liff-init' | 'logged-in' | 'got-id-token' | 'post-auth' | 'ok' | 'error';

function LiffPageContent() {
  const [stage, setStage] = useState<DiagnosticStage>('init');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('to') || '/generator';

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        addDebugInfo('Starting LIFF initialization');
        setStage('init');

        if (!process.env.NEXT_PUBLIC_LIFF_ID) {
          throw new Error('LIFF ID is not configured');
        }

        addDebugInfo(`LIFF ID: ${process.env.NEXT_PUBLIC_LIFF_ID}`);
        setStage('loading-sdk');

        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.async = true;
        document.head.appendChild(script);

        script.onload = async () => {
          try {
            addDebugInfo('LIFF SDK loaded successfully');
            setStage('sdk-loaded');

            addDebugInfo('Initializing LIFF...');
            setStage('liff-init');
            await window.liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
            addDebugInfo('LIFF initialized successfully');

            if (!window.liff.isLoggedIn()) {
              addDebugInfo('User not logged in, redirecting to LINE login');
              window.liff.login({ redirectUri: window.location.href });
              return;
            }

            addDebugInfo('User is logged in');
            setStage('logged-in');

            const idToken = window.liff.getIDToken();
            if (!idToken) {
              throw new Error('Failed to get ID token - idToken is null');
            }

            addDebugInfo('ID token obtained successfully');
            setStage('got-id-token');

            addDebugInfo('Sending authentication request to server...');
            setStage('post-auth');

            const response = await fetch('/api/auth/line', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ idToken }),
              cache: 'no-store'
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`LINE auth failed: ${errorText}`);
            }

            const data = await response.json();
            addDebugInfo('Server authentication successful');

            addDebugInfo('Verifying session establishment...');
            let sessionEstablished = false;
            for (let i = 0; i < 3; i++) {
              const meResponse = await fetch('/api/me', { cache: 'no-store' });
              if (meResponse.ok) {
                sessionEstablished = true;
                addDebugInfo(`Session verified on attempt ${i + 1}`);
                break;
              }
              addDebugInfo(`Session check ${i + 1}/3 failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (!sessionEstablished) {
              throw new Error('Session not established after authentication');
            }

            setStage('ok');
            addDebugInfo(`Redirecting to: ${redirectTo}`);
            router.replace(redirectTo);
          } catch (err) {
            console.error('LIFF initialization error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            setError(errorMessage);
            addDebugInfo(`Error: ${errorMessage}`);
            setStage('error');
          }
        };

        script.onerror = () => {
          const errorMessage = 'Failed to load LIFF SDK';
          setError(errorMessage);
          addDebugInfo(`Error: ${errorMessage}`);
          setStage('error');
        };
      } catch (err) {
        console.error('LIFF setup error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Setup failed';
        setError(errorMessage);
        addDebugInfo(`Error: ${errorMessage}`);
        setStage('error');
      }
    };

    initializeLiff();
  }, [redirectTo, router]);

  const getStageDisplay = (currentStage: DiagnosticStage) => {
    const stages = [
      { key: 'init', label: '初期化', icon: '🔄' },
      { key: 'loading-sdk', label: 'SDK読み込み', icon: '📦' },
      { key: 'sdk-loaded', label: 'SDK読み込み完了', icon: '✅' },
      { key: 'liff-init', label: 'LIFF初期化', icon: '🚀' },
      { key: 'logged-in', label: 'ログイン確認', icon: '👤' },
      { key: 'got-id-token', label: 'IDトークン取得', icon: '🔑' },
      { key: 'post-auth', label: 'サーバー認証', icon: '🌐' },
      { key: 'ok', label: '認証完了', icon: '🎉' },
      { key: 'error', label: 'エラー', icon: '❌' },
    ];

    return stages.map(stageInfo => {
      const isActive = stageInfo.key === currentStage;
      const isPassed = stages.findIndex(s => s.key === currentStage) > stages.findIndex(s => s.key === stageInfo.key);
      
      return (
        <div
          key={stageInfo.key}
          className={`flex items-center space-x-2 p-2 rounded ${
            isActive ? 'bg-blue-100 border-blue-300 border' :
            isPassed ? 'bg-green-100' :
            'bg-gray-100'
          }`}
        >
          <span className="text-lg">{stageInfo.icon}</span>
          <span className={`${isActive ? 'font-bold text-blue-700' : isPassed ? 'text-green-700' : 'text-gray-600'}`}>
            {stageInfo.label}
          </span>
          {isActive && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">NEXUS ACADEMY</h1>
          <p className="text-gray-600">LINE認証診断</p>
        </div>

        <div className="space-y-2 mb-6">
          {getStageDisplay(stage)}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">認証エラー</p>
            <p className="text-sm break-words">{error}</p>
          </div>
        )}

        {debugInfo.length > 0 && (
          <div className="bg-gray-100 border border-gray-300 rounded p-3 mb-4">
            <p className="font-bold text-gray-700 mb-2">デバッグ情報:</p>
            <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className="break-words">{info}</div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
          >
            再試行
          </button>
        )}
      </div>
    </div>
  );
}

export default function LiffPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <LiffPageContent />
    </Suspense>
  );
}
