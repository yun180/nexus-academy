import React from 'react';
import { TestSummary } from '../types';
import Button from './Button';

interface SummaryScreenProps {
    summary: TestSummary | null;
    onReset: () => void;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ summary, onReset }) => {
    if (!summary) {
        return <p>サマリーを読み込み中...</p>;
    }

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}分 ${secs}秒`;
    };

    return (
        <div className="space-y-8 text-center">
            <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400">成績サマリー</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">評価指標</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">正答率:</span>
                            <span className={`font-bold text-xl ${summary.accuracy > 80 ? 'text-green-500' : summary.accuracy > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {summary.accuracy.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">解答時間:</span>
                            <span className="font-bold text-xl text-slate-800 dark:text-slate-200">{formatTime(summary.timeTaken)}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">要復習の重要タグ</h3>
                    {summary.keyTags.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                            {summary.keyTags.map(tag => (
                                <span key={tag} className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-yellow-700 dark:text-yellow-200">{tag}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400">特に弱点はありません。素晴らしいです！</p>
                    )}
                </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-lg shadow-md text-left">
                 <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">推奨事項と次のステップ</h3>
                 <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{summary.recommendations}</p>
            </div>

            <div className="pt-6">
                <Button onClick={onReset} className="px-8 py-3 text-lg">
                    新しいチャレンジを始める
                </Button>
            </div>
        </div>
    );
};

export default SummaryScreen;
