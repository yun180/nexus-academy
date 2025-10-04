'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { TestConfig, Question, Feedback, TestSummary } from './types';
import * as geminiService from './services/geminiService';

import SelectionScreen from './components/SelectionScreen';
import TestScreen from './components/TestScreen';
import FeedbackScreen from './components/FeedbackScreen';
import SummaryScreen from './components/SummaryScreen';
import LoadingSpinner from './components/LoadingSpinner';
import HistorySection from './components/HistorySection';
import Card from './components/Card';

type AppState = 'selecting' | 'generating' | 'testing' | 'feedback' | 'summary';

export default function ChallengePage() {
    const [appState, setAppState] = useState<AppState>('selecting');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
    const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
    const [testHistory, setTestHistory] = useState<TestSummary[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('testHistory');
            if (storedHistory) {
                setTestHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to load history from localStorage", e);
        }
    }, []);
    
    useEffect(() => {
        if (testHistory.length > 0) {
            try {
                localStorage.setItem('testHistory', JSON.stringify(testHistory));
            } catch (e) {
                console.error("Failed to save history to localStorage", e);
            }
        }
    }, [testHistory]);

    const handleStartTest = async (config: TestConfig) => {
        setTestConfig(config);
        setAppState('generating');
        setLoadingMessage('AIがあなたのためのテストを作成中です...');
        setError(null);
        try {
            const generatedQuestions = await geminiService.generateTest(config);
            if (generatedQuestions.length === 0) {
                 throw new Error("AIが問題を作成できませんでした。条件を変更してもう一度お試しください。");
            }
            setQuestions(generatedQuestions);
            setAppState('testing');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setAppState('selecting');
        }
    };
    
    const handleSubmitTest = async (answers: string[]) => {
        if (!testConfig) return;
        setLoadingMessage('AIが解答を採点し、フィードバックを生成中です...');
        setAppState('generating');
        setError(null);
        try {
            const feedbackResults = await geminiService.generateFeedback(questions, answers);
            setFeedback(feedbackResults);

            const incorrectTags = feedbackResults
                .filter((f: Feedback) => !f.isCorrect)
                .flatMap((f: Feedback) => f.question.tags);
            
            if (incorrectTags.length > 0) {
                 setLoadingMessage('苦手分野の復習問題を作成中です...');
                 const uniqueTags = [...new Set(incorrectTags)];
                 const reviewQs = await geminiService.generateReviewTest(testConfig, uniqueTags);
                 setReviewQuestions(reviewQs);
            } else {
                 setReviewQuestions([]);
            }

            setAppState('feedback');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during feedback generation.");
            setAppState('testing');
        }
    };

    const handleCompleteFeedback = async (timeTaken: number) => {
         if (!testConfig) return;
        setLoadingMessage('AIがあなたの成績を分析し、サマリーを作成中です...');
        setAppState('generating');
        setError(null);
         try {
            const correctCount = feedback.filter(f => f.isCorrect).length;
            const accuracy = (correctCount / questions.length) * 100;
            const incorrectTags = [...new Set(feedback
                .filter((f: Feedback) => !f.isCorrect)
                .flatMap((f: Feedback) => f.question.tags))
            ];
            
            const recommendations = await geminiService.generateSummary(accuracy, timeTaken, incorrectTags);

            const summary: TestSummary = {
                id: `summary-${Date.now()}`,
                date: Date.now(),
                config: testConfig,
                accuracy,
                timeTaken,
                keyTags: incorrectTags,
                recommendations,
            };

            setTestSummary(summary);
            setTestHistory(prev => [summary, ...prev].slice(0, 10));
            setAppState('summary');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during summary generation.");
            setAppState('feedback');
        }
    };
    
    const handleReset = () => {
        setAppState('selecting');
        setTestConfig(null);
        setQuestions([]);
        setFeedback([]);
        setReviewQuestions([]);
        setTestSummary(null);
        setError(null);
    };

    const handleLoadHistory = (summary: TestSummary) => {
        setTestSummary(summary);
        setAppState('summary');
    }

    const renderContent = () => {
        switch (appState) {
            case 'selecting':
                return (
                    <>
                        <SelectionScreen onStartTest={handleStartTest} />
                        <HistorySection history={testHistory} onLoadTest={handleLoadHistory} />
                    </>
                );
            case 'generating':
                return <Card><LoadingSpinner message={loadingMessage} /></Card>;
            case 'testing':
                return testConfig && <TestScreen questions={questions} timeLimitMinutes={testConfig.timeLimit} onSubmit={handleSubmitTest} />;
            case 'feedback':
                return <FeedbackScreen feedback={feedback} reviewQuestions={reviewQuestions} onComplete={handleCompleteFeedback} />;
            case 'summary':
                return <SummaryScreen summary={testSummary} onReset={handleReset} />;
            default:
                return <p>エラーが発生しました。</p>;
        }
    };

    return (
        <Layout>
            <div className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
                <header className="bg-white dark:bg-slate-800/50 shadow-md py-4">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400 text-center">
                            チャレンジマッチ
                        </h1>
                    </div>
                </header>
                <main className="container mx-auto p-4 md:p-8 max-w-4xl">
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                            <p className="font-bold">エラー</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {renderContent()}
                </main>
            </div>
        </Layout>
    );
}
