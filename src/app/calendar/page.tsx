'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function CalendarPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    description?: string;
    htmlLink?: string;
    meetUrl?: string;
  }>>([]);

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

    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/calendar/feed');
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchUser();
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <Layout title="日程カレンダー">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <Layout title="日程カレンダー">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentYear}年 {monthNames[currentMonth]}
            </h2>
            {user?.plan === 'free' && (
              <div className="text-sm text-gray-500">
                PLUS版では予定の編集が可能です
              </div>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className={`p-2 h-20 border border-gray-200 ${
                  day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${day === currentDate.getDate() ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                {day && (
                  <div className="text-sm">
                    <div className={`font-medium ${
                      day === currentDate.getDate() ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    {/* Real events */}
                    {events
                      .filter(event => {
                        const eventDate = new Date(event.start);
                        return eventDate.getDate() === day && 
                               eventDate.getMonth() === currentMonth &&
                               eventDate.getFullYear() === currentYear;
                      })
                      .map((event, eventIndex) => (
                        <div 
                          key={eventIndex}
                          className="mt-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded cursor-pointer hover:bg-blue-200"
                          title={event.title}
                        >
                          {event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="flex space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
                <span className="text-sm text-gray-600">グループ授業</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                <span className="text-sm text-gray-600">個別指導</span>
              </div>
            </div>
            
            {user?.plan === 'free' ? (
              <button className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed">
                予定編集（PLUS限定）
              </button>
            ) : (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                予定を追加
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
