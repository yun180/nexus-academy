'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UpgradeModal from '@/components/UpgradeModal';

interface Goal {
  id: string;
  target_school: string;
  exam_date: string;
  current_level: string;
  target_subjects: string[];
  study_plan: {
    totalWeeks: number;
    weeklySchedule: Array<{
      subject: string;
      hoursPerWeek: number;
      topics: string[];
    }>;
    milestones: Array<{
      week: number;
      description: string;
    }>;
  };
}

export default function GoalPlannerPage() {
  const [user, setUser] = useState<{ plan: 'free' | 'plus' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    targetSchool: '',
    examDate: '',
    currentLevel: '基礎',
    targetSubjects: [] as string[]
  });
  const [generating, setGenerating] = useState(false);

  const subjects = ['数学', '英語', '国語', '理科', '社会'];
  const levels = ['基礎', '標準', '応用'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, goalResponse] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/goal-planner')
        ]);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        if (goalResponse.ok) {
          const goalData = await goalResponse.json();
          setGoal(goalData.goal);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      targetSubjects: prev.targetSubjects.includes(subject)
        ? prev.targetSubjects.filter(s => s !== subject)
        : [...prev.targetSubjects, subject]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.targetSubjects.length === 0) {
      alert('少なくとも1つの科目を選択してください');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/goal-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setGoal(data.goal);
      } else {
        const error = await response.json();
        alert(error.error || '学習計画の生成に失敗しました');
      }
    } catch (error) {
      console.error('Goal creation error:', error);
      alert('エラーが発生しました');
    } finally {
      setGenerating(false);
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
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">ゴールプランナー</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">学習目標設定</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  志望校
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: 東京大学"
                  value={formData.targetSchool}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetSchool: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  試験日
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.examDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, examDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在のレベル
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.currentLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentLevel: e.target.value }))}
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  対象科目
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map(subject => (
                    <label key={subject} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={formData.targetSubjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                      />
                      <span className="ml-2 text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  generating
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {generating ? '学習計画生成中...' : '学習計画を生成'}
              </button>
            </form>
          </div>

          {goal && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">学習計画</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">志望校: {goal.target_school}</h3>
                  <p className="text-sm text-gray-600">試験日: {new Date(goal.exam_date).toLocaleDateString('ja-JP')}</p>
                  <p className="text-sm text-gray-600">学習期間: {goal.study_plan.totalWeeks}週間</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">週間スケジュール</h4>
                  {goal.study_plan.weeklySchedule.map((schedule, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded mb-2">
                      <div className="font-medium text-sm">{schedule.subject} - 週{schedule.hoursPerWeek}時間</div>
                      <ul className="text-xs text-gray-600 mt-1">
                        {schedule.topics.map((topic, topicIndex) => (
                          <li key={topicIndex}>• {topic}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">マイルストーン</h4>
                  {goal.study_plan.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      第{milestone.week}週: {milestone.description}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
