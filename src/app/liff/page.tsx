'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      getIDToken: () => string;
      login: () => void;
    };
  }
}

function LiffPageContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('to') || '/generator';

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_LIFF_ID) {
          throw new Error('LIFF ID is not configured');
        }

        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.async = true;
        document.head.appendChild(script);

        script.onload = async () => {
          try {
            await window.liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' });

            if (!window.liff.isLoggedIn()) {
              window.liff.login();
              return;
            }

            const idToken = window.liff.getIDToken();
            if (!idToken) {
              throw new Error('Failed to get ID token');
            }

            const response = await fetch('/api/auth/line', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                idToken,
                redirectTo,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Authentication failed');
            }

            router.push(data.redirectTo);
          } catch (err) {
            console.error('LIFF initialization error:', err);
            setError(err instanceof Error ? err.message : 'Authentication failed');
            setIsLoading(false);
          }
        };

        script.onerror = () => {
          setError('Failed to load LIFF SDK');
          setIsLoading(false);
        };
      } catch (err) {
        console.error('LIFF setup error:', err);
        setError(err instanceof Error ? err.message : 'Setup failed');
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, [redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">LINE認証中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">認証エラー</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return null;
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
