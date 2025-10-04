import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import Button from './Button';
import MarkdownRenderer from './MarkdownRenderer';

interface TestScreenProps {
    questions: Question[];
    timeLimitMinutes: number;
    onSubmit: (answers: string[]) => void;
}

const TestScreen: React.FC<TestScreenProps> = ({ questions, timeLimitMinutes, onSubmit }) => {
    const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
    const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        const endTime = Date.now();
        const timeTaken = Math.round((endTime - startTimeRef.current) / 1000);
        onSubmit(answers);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-8">
            <div className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm py-4 z-10 flex justify-between items-center rounded-lg px-4 -mx-4">
                <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400">チャレンジ進行中</h2>
                <div className="text-xl font-mono bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-md shadow-inner text-slate-800 dark:text-slate-200">
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="space-y-6">
                {questions.map((q, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                        <p className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            <span className="font-bold mr-2">{index + 1}.</span>
                            <MarkdownRenderer text={q.questionText} />
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {q.tags.map(tag => (
                                <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-700 dark:text-blue-200">{tag}</span>
                            ))}
                        </div>
                        <textarea
                            value={answers[index]}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            placeholder="解答を入力してください..."
                            rows={4}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
                        />
                    </div>
                ))}
            </div>

            <div className="text-center pt-6">
                <Button onClick={handleSubmit} className="px-8 py-3 text-lg">
                    テストを提出
                </Button>
            </div>
        </div>
    );
};

export default TestScreen;
