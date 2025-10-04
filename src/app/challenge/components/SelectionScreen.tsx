import React, { useState, useEffect } from 'react';
import { TestConfig, TestType, Subject, Grade, Difficulty } from '../types';
import { TEST_TYPES, SUBJECTS, GRADES, DIFFICULTIES, UNITS, TIME_LIMITS } from '../constants';
import Button from './Button';
import Card from './Card';

interface SelectionScreenProps {
    onStartTest: (config: TestConfig) => void;
}

const SelectionOptionButton: React.FC<{
    isSelected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}> = ({ isSelected, onClick, children, className }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 border ${
            isSelected
                ? 'bg-purple-600 text-white border-purple-600 shadow'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
        } ${className}`}
    >
        {children}
    </button>
);

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onStartTest }) => {
    const [testType, setTestType] = useState<TestType>(TestType.UnitReview);
    const [subject, setSubject] = useState<Subject>(Subject.Mathematics);
    const [grade, setGrade] = useState<Grade>(Grade.JH1);
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Standard);
    const [timeLimit, setTimeLimit] = useState<number>(15);
    
    useEffect(() => {
        const units = UNITS[subject]?.[grade] || [];
        setAvailableUnits(units);
        setSelectedUnits([]);
    }, [subject, grade, testType]);

    const handleUnitChange = (unit: string) => {
        if (testType === TestType.UnitReview) {
            setSelectedUnits([unit]);
        } else {
            setSelectedUnits(prev =>
                prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
            );
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const questionCount = parseInt(TIME_LIMITS[timeLimit].split('〜')[0]);
        const config: TestConfig = {
            type: testType,
            subject,
            grade,
            units: selectedUnits,
            difficulty,
            questionCount,
            timeLimit,
        };
        onStartTest(config);
    };

    const isFormValid = selectedUnits.length > 0;

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-8">
                <h2 className="text-2xl font-bold text-center text-purple-600 dark:text-purple-400">実力テスト設定</h2>

                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">1. テスト形式を選択</h3>
                    <div className="flex flex-wrap gap-3">
                        {TEST_TYPES.map(type => (
                            <SelectionOptionButton key={type} isSelected={testType === type} onClick={() => setTestType(type)}>
                                {type}
                            </SelectionOptionButton>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">2. 教科を選択</h3>
                    <div className="flex flex-wrap gap-3">
                        {SUBJECTS.map(s => (
                           <SelectionOptionButton key={s} isSelected={subject === s} onClick={() => setSubject(s)}>
                                {s}
                            </SelectionOptionButton>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">3. 学年を選択</h3>
                    <div className="flex flex-wrap gap-3">
                        {GRADES.map(g => (
                            <SelectionOptionButton key={g} isSelected={grade === g} onClick={() => setGrade(g)}>
                                {g}
                            </SelectionOptionButton>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        4. 単元を選択 {testType === TestType.UnitReview ? '- 1つ選択' : '- 複数選択'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                       {availableUnits.map(unit => (
                            <SelectionOptionButton key={unit} isSelected={selectedUnits.includes(unit)} onClick={() => handleUnitChange(unit)}>
                                {unit}
                            </SelectionOptionButton>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">5. 難易度を選択</h3>
                    <div className="flex flex-wrap gap-3">
                        {DIFFICULTIES.map(d => (
                            <SelectionOptionButton key={d} isSelected={difficulty === d} onClick={() => setDifficulty(d)}>
                                {d}
                            </SelectionOptionButton>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">6. 制限時間を選択</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(TIME_LIMITS).map(([minutes, count]) => (
                            <SelectionOptionButton 
                                key={minutes} 
                                isSelected={timeLimit === Number(minutes)} 
                                onClick={() => setTimeLimit(Number(minutes))}
                                className="flex flex-col items-center !px-6 !py-3"
                            >
                                <span className="font-bold text-lg">{minutes}分</span>
                                <span className="text-xs opacity-80">({count})</span>
                            </SelectionOptionButton>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={!isFormValid} className="w-full py-3 text-lg">
                        テスト生成
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default SelectionScreen;
