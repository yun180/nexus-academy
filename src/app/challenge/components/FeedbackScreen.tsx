import React, { useState, useRef } from 'react';
import { Feedback, Question } from '../types';
import Button from './Button';
import MarkdownRenderer from './MarkdownRenderer';

interface FeedbackScreenProps {
    feedback: Feedback[];
    reviewQuestions: Question[];
    onComplete: (timeTaken: number) => void;
}

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ feedback, reviewQuestions, onComplete }) => {
    const [reviewAnswers, setReviewAnswers] = useState<string[]>(Array(reviewQuestions.length).fill(''));
    const startTimeRef = useRef<number>(Date.now());
    const [showReview, setShowReview] = useState(false);

    const handleReviewAnswerChange = (index: number, value: string) => {
        const newAnswers = [...reviewAnswers];
        newAnswers[index] = value;
        setReviewAnswers(newAnswers);
    };
    
    const handleComplete = () => {
        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
        onComplete(timeTaken);
    };

    const hasIncorrectAnswers = feedback.some(f => !f.isCorrect);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-center mb-6 text-purple-600 dark:text-purple-400">テスト結果</h2>
                <div className="space-y-6">
                    {feedback.map((item, index) => (
                        <div key={index} className={`p-6 rounded-lg shadow-md border-l-4 ${item.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : 'border-red-500 bg-red-50 dark:bg-red-900/30'}`}>
                            <p className="font-semibold text-lg mb-2 whitespace-pre-wrap">
                                <span className="font-bold">{index + 1}.</span>{' '}
                                <MarkdownRenderer text={item.question.questionText} />
                            </p>
                            <div className="text-sm space-y-3 pl-5">
                                <p><span className="font-semibold">あなたの解答:</span> <span className={`${item.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'} whitespace-pre-wrap`}>{item.userAnswer || '"無回答"'}</span></p>
                                {!item.isCorrect && <p><span className="font-semibold">正解:</span> <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.question.correctAnswer}</span></p>}
                                <p className="pt-2"><span className="font-semibold">解説:</span> <span className="text-slate-600 dark:text-slate-400">{item.explanation}</span></p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {item.question.tags.map(tag => (
                                        <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-700 dark:text-blue-200">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {hasIncorrectAnswers && reviewQuestions.length > 0 && !showReview && (
                 <div className="text-center pt-4">
                    <Button onClick={() => setShowReview(true)} className="px-6 py-2">
                        ミニ復習テストを開始
                    </Button>
                </div>
            )}

            {showReview && (
                <div>
                    <h3 className="text-2xl font-bold text-center mb-6 text-blue-600 dark:text-blue-400">ミニ復習テスト</h3>
                    <div className="space-y-6">
                        {reviewQuestions.map((q, index) => (
                             <div key={index} className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                                <p className="font-semibold text-lg mb-2 whitespace-pre-wrap">
                                    <span className="font-bold">{index + 1}.</span>{' '}
                                    <MarkdownRenderer text={q.questionText} />
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {q.tags.map(tag => (
                                        <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-700 dark:text-blue-200">{tag}</span>
                                    ))}
                                </div>
                                <textarea
                                    value={reviewAnswers[index]}
                                    onChange={(e) => handleReviewAnswerChange(index, e.target.value)}
                                    placeholder="解答を入力してください..."
                                    rows={3}
                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {(!hasIncorrectAnswers || showReview) && (
                <div className="text-center pt-6">
                    <Button onClick={handleComplete} className="px-8 py-3 text-lg">
                        サマリーを見る
                    </Button>
                </div>
            )}
        </div>
    );
};

export default FeedbackScreen;
