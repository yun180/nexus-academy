'use client';

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import UpgradeModal from '@/components/UpgradeModal';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  image?: string;
  videoUrl?: string;
  timestamp: Date;
}

interface ChatSettings {
  subject: '数学' | '英語';
  responseType: '解答解説' | '解法' | 'ヒント' | '動画解説';
}

export default function ChatPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    subject: '数学',
    responseType: '解答解説'
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const checkUsageLimit = () => {
    if (user?.plan === 'plus') return true;
    if (usageCount >= 3) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;
    if (!checkUsageLimit()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      image: imagePreview || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('message', inputText);
      formData.append('subject', settings.subject);
      formData.append('responseType', settings.responseType);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          videoUrl: data.videoUrl,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setUsageCount(prev => prev + 1);
      } else {
        const error = await response.json();
        if (error.feature === 'chat-limit') {
          setShowUpgradeModal(true);
        } else {
          alert('エラーが発生しました: ' + (error.error || '不明なエラー'));
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      alert('エラーが発生しました');
    } finally {
      setIsTyping(false);
      removeImage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">AIチャット - ソリューションナビ</h1>
            {user?.plan === 'free' && (
              <div className="text-sm text-gray-600">
                残り利用回数: {3 - usageCount}回
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mb-4">
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
                onChange={(e) => setSettings(prev => ({ ...prev, responseType: e.target.value as '解答解説' | '解法' | 'ヒント' | '動画解説' }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="解答解説">解答解説</option>
                <option value="解法">解法</option>
                <option value="ヒント">ヒント</option>
                <option value="動画解説">動画解説</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p>数学や英語の質問をしてください。</p>
                <p className="text-sm mt-2">画像をアップロードして問題を送ることもできます。</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Uploaded"
                      className="max-w-full h-auto rounded mb-2"
                    />
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.videoUrl && (
                    <div className="mt-3">
                      <video 
                        controls 
                        className="w-full rounded-lg"
                        style={{ maxWidth: '400px' }}
                      >
                        <source src={message.videoUrl} type="video/mp4" />
                        お使いのブラウザは動画再生に対応していません。
                      </video>
                    </div>
                  )}
                  <div
                    className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-4">
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-32 h-auto rounded border"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="画像をアップロード"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="質問を入力してください..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              
              <button
                onClick={sendMessage}
                disabled={(!inputText.trim() && !selectedImage) || isTyping}
                className="flex-shrink-0 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        reason="feature_locked"
      />
    </Layout>
  );
}
