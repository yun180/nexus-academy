'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatSettings {
  subject: '数学' | '英語';
  responseType: '解答解説' | '解法' | 'ヒント';
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    subject: '数学',
    responseType: '解答解説'
  });

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', inputMessage);
      formData.append('subject', settings.subject);
      formData.append('responseType', settings.responseType);

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'すみません、エラーが発生しました。もう一度お試しください。',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6">
              <h1 className="text-2xl font-bold text-white mb-2">AIチャット</h1>
              <p className="text-blue-100">数学・英語の質問にAIが答えます（無制限）</p>
            </div>

            <div className="bg-white border-b p-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">科目:</label>
                  <select
                    value={settings.subject}
                    onChange={(e) => setSettings(prev => ({ ...prev, subject: e.target.value as '数学' | '英語' }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="数学">数学</option>
                    <option value="英語">英語</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">回答タイプ:</label>
                  <select
                    value={settings.responseType}
                    onChange={(e) => setSettings(prev => ({ ...prev, responseType: e.target.value as '解答解説' | '解法' | 'ヒント' }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="解答解説">解答解説</option>
                    <option value="解法">解法</option>
                    <option value="ヒント">ヒント</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <div className="text-4xl mb-4">💬</div>
                  <p>数学や英語の質問をしてください！</p>
                  <p className="text-sm mt-2">無制限でご利用いただけます</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-cyan-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                      <span>AIが考えています...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <div className="flex space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力してください..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
