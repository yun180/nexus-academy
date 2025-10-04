import React from 'react';
import { TestSummary } from '../types';
import Card from './Card';
import Button from './Button';

interface HistorySectionProps {
    history: TestSummary[];
    onLoadTest: (summary: TestSummary) => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({ history, onLoadTest }) => {
    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-6 text-purple-600 dark:text-purple-400">過去のチャレンジ履歴</h2>
            {history.length === 0 ? (
                <Card>
                    <p className="text-center text-slate-500 dark:text-slate-400">まだ履歴はありません。</p>
                </Card>
            ) : (
                <Card>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {history.map((item) => (
                            <li key={item.id} className="py-3 sm:flex sm:items-center sm:justify-between">
                                <div className="mb-2 sm:mb-0">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {new Date(item.date).toLocaleDateString('ja-JP')} - {item.config.subject} ({item.config.grade})
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        正答率: <span className={`font-medium ${item.accuracy >= 80 ? 'text-green-500' : item.accuracy >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{item.accuracy.toFixed(1)}%</span>
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <Button onClick={() => onLoadTest(item)} variant="secondary" className="px-3 py-1 text-sm">
                                        詳細を見る
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
    );
};

export default HistorySection;
