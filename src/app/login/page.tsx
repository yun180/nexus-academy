'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      getIDToken: () => string;
      login: () => void;
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

export default function LoginPage() {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          setError('LIFF ID not configured');
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.onload = async () => {
          try {
            await window.liff.init({ liffId });
            setIsLiffReady(true);
            
            if (window.liff.isLoggedIn()) {
              setIsLoggedIn(true);
              const profile = await window.liff.getProfile();
              setUserProfile(profile);
              
              const idToken = window.liff.getIDToken();
              await authenticateWithServer(idToken, profile);
            }
          } catch (error) {
            console.error('LIFF initialization failed:', error);
            setError('LIFF initialization failed');
          }
        };
        script.onerror = () => {
          setError('Failed to load LIFF SDK');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading LIFF:', error);
        setError('Error loading LIFF');
      }
    };

    initializeLiff();
  }, []);

  const authenticateWithServer = async (idToken: string, profile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }) => {
    try {
      const response = await fetch('/api/auth/line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Authentication successful:', data);
        
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('to') || '/generator';
        router.push(redirectTo);
      } else {
        const errorData = await response.json();
        setError(`Authentication failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Server authentication error:', error);
      setError('Server authentication failed');
    }
  };

  const handleLogin = async () => {
    try {
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      if (window.liff.isLoggedIn()) {
        window.liff.logout();
        setIsLoggedIn(false);
        setUserProfile(null);
        
        await fetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Logout failed');
    }
  };

  if (!isLiffReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">LIFF を初期化中...</p>
          {error && (
            <p className="text-red-600 mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            NEXUS ACADEMY
          </h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {!isLoggedIn ? (
            <div>
              <p className="text-gray-600 mb-6">
                LINEアカウントでログインしてください
              </p>
              <button
                onClick={handleLogin}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                LINEでログイン
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                {userProfile?.pictureUrl && (
                  <img
                    src={userProfile.pictureUrl}
                    alt="Profile"
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                )}
                <h2 className="text-xl font-semibold text-gray-900">
                  {userProfile?.displayName || 'ユーザー'}
                </h2>
                <p className="text-gray-600">ログイン済み</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/generator')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  教材生成へ
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
