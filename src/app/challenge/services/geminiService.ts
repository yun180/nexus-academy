import { TestConfig, Question, Feedback, Subject } from '../types';

const MATH_NOTATION_RULES = "Strictly use the following mathematical notation: Division: ÷, Multiplication: ×, Subtraction: −, Addition: ＋, Square root: √ (e.g., √2, √(x＋1)), Exponentiation: as 'x²', Fractions: as '1/2'.";
const ENGLISH_QUESTION_MIX = "For English questions, create a mix of grammar (fill-in-the-blank, sentence ordering, error correction), short reading comprehension, and simple composition tasks.";

const createSystemInstruction = (subject: Subject) => {
    let instruction = "あなたは優れた教育コンテンツの作成者です。ユーザーの指定に基づき、実力テストを作成してください。要求された形式を厳守し、各問題に詳細かつ正確な学習タグを付けてください。";

    if (subject === Subject.Mathematics) {
        instruction += ` ${MATH_NOTATION_RULES}`;
        instruction += " 数学の問題、解説、タグはすべて日本語で生成してください。";
    }
    if (subject === Subject.English) {
        instruction += ` ${ENGLISH_QUESTION_MIX}`;
        instruction += " 英語のテストなので、問題文、選択肢、正解は英語で生成してください。ただし、問題の指示、学習タグ、フィードバックの解説、サマリーは日本語で生成してください。";
    }
    return instruction;
}

export const generateTest = async (config: TestConfig): Promise<Question[]> => {
    const response = await fetch('/api/challenge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate test');
    }

    const data = await response.json();
    return data.questions;
};

export const generateFeedback = async (questions: Question[], userAnswers: string[]): Promise<Feedback[]> => {
    const response = await fetch('/api/challenge/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, userAnswers })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate feedback');
    }

    const data = await response.json();
    return data.feedback;
};

export const generateReviewTest = async (config: TestConfig, tags: string[]): Promise<Question[]> => {
    const response = await fetch('/api/challenge/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, tags })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate review test');
    }

    const data = await response.json();
    return data.questions;
};

export const generateSummary = async (accuracy: number, timeTaken: number, incorrectTags: string[]): Promise<string> => {
    const response = await fetch('/api/challenge/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accuracy, timeTaken, incorrectTags })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate summary');
    }

    const data = await response.json();
    return data.summary;
};
