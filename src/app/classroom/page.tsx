'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function ClassroomPage() {
  const [, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingType, setBookingType] = useState<'group' | 'individual'>('group');
  const [booking, setBooking] = useState({
    start: '',
    end: '',
    topic: '',
    attendeeEmail: ''
  });
  const [bookingResult, setBookingResult] = useState<{
    eventUrl: string;
    meetUrl?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/me');
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

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/classroom/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: new Date(booking.start).toISOString(),
          end: new Date(booking.end).toISOString(),
          topic: `${bookingType === 'group' ? 'グループ授業' : '個別指導'}: ${booking.topic}`,
          attendeeEmail: booking.attendeeEmail
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setBookingResult(result);
        setShowBookingForm(false);
        setBooking({ start: '', end: '', topic: '', attendeeEmail: '' });
      } else {
        const error = await response.json();
        alert(error.error || '予約に失敗しました');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('予約中にエラーが発生しました');
    }
  };

  const copyMeetUrl = () => {
    if (bookingResult?.meetUrl) {
      navigator.clipboard.writeText(bookingResult.meetUrl);
      alert('Meet URLをコピーしました');
    }
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">オンライン教室</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                オンライン授業・個別指導
              </h3>
              <p className="text-gray-600 mb-4">
                専門講師によるリアルタイム授業と個別指導セッション
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">グループ授業</h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• 少人数制クラス（最大8名）</li>
                <li>• 双方向コミュニケーション</li>
                <li>• 録画視聴可能</li>
                <li>• 質疑応答セッション</li>
              </ul>
              <button 
                onClick={() => {
                  setBookingType('group');
                  setShowBookingForm(true);
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
              >
                授業を予約
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">個別指導</h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• マンツーマン指導</li>
                <li>• カスタマイズされたカリキュラム</li>
                <li>• 弱点克服に特化</li>
                <li>• 進捗管理とフィードバック</li>
              </ul>
              <button 
                onClick={() => {
                  setBookingType('individual');
                  setShowBookingForm(true);
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
              >
                個別指導を予約
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">今後の授業予定</h3>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">予約された授業はありません</p>
              <p className="text-sm text-gray-400 mt-2">上記のボタンから授業を予約してください</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {bookingType === 'group' ? 'グループ授業' : '個別指導'}の予約
            </h3>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日時
                </label>
                <input
                  type="datetime-local"
                  value={booking.start}
                  onChange={(e) => setBooking({...booking, start: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日時
                </label>
                <input
                  type="datetime-local"
                  value={booking.end}
                  onChange={(e) => setBooking({...booking, end: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  授業トピック
                </label>
                <input
                  type="text"
                  value={booking.topic}
                  onChange={(e) => setBooking({...booking, topic: e.target.value})}
                  placeholder="例: 数学 - 二次関数"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  参加者メールアドレス
                </label>
                <input
                  type="email"
                  value={booking.attendeeEmail}
                  onChange={(e) => setBooking({...booking, attendeeEmail: e.target.value})}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  予約する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {bookingResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                予約が完了しました！
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                カレンダーに予定が追加され、招待メールが送信されました。
              </p>
              
              {bookingResult.meetUrl && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Google Meet URL</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={bookingResult.meetUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded bg-white"
                    />
                    <button
                      onClick={copyMeetUrl}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setBookingResult(null)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
