export enum TestType {
    UnitReview = "単元別復習テスト",
    ComprehensiveReview = "総合復習テスト",
}

export enum Subject {
    Mathematics = "数学",
    English = "英語",
}

export enum Grade {
    JH1 = "中学1年",
    JH2 = "中学2年",
    JH3 = "中学3年",
    SH1 = "高校1年",
    SH2 = "高校2年",
    SH3 = "高校3年",
}

export enum Difficulty {
    Basic = "基礎",
    Standard = "標準",
    Advanced = "応用",
    PastExam = "過去問レベル",
}

export interface TestConfig {
    type: TestType;
    subject: Subject;
    grade: Grade;
    units: string[];
    difficulty: Difficulty;
    questionCount: number;
    timeLimit: number;
}

export interface Question {
    questionText: string;
    correctAnswer: string;
    tags: string[];
}

export interface Feedback {
    question: Question;
    userAnswer: string;
    isCorrect: boolean;
    explanation: string;
}

export interface TestSummary {
    id: string;
    date: number;
    config: TestConfig;
    accuracy: number;
    timeTaken: number;
    keyTags: string[];
    recommendations: string;
}
