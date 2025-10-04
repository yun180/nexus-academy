import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '../../../../lib/ai-providers';
import { TestConfig, Subject } from '../../../challenge/types';

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

export async function POST(request: NextRequest) {
    try {
        const { config, tags }: { config: TestConfig, tags: string[] } = await request.json();
        const aiProvider = getAIProvider();

        const prompt = `
            生徒が苦手としている以下の学習タグに焦点を当てた、3〜5問のミニ復習テストを生成してください。必ずJSON形式で回答してください:
            - 教科: ${config.subject}
            - 学年: ${config.grade}
            - 難易度: ${config.difficulty}
            - 対象学習タグ: ${tags.join(', ')}

            これらのタグの中核となる概念をテストする新しい問題を作成してください。
            
            回答は以下のJSON形式で返してください:
            {
              "questions": [
                {
                  "questionText": "問題文",
                  "correctAnswer": "正解",
                  "tags": ["タグ1", "タグ2"]
                }
              ]
            }
        `;
        
        const systemInstruction = createSystemInstruction(config.subject);
        const response = await aiProvider.generateContent(prompt, systemInstruction);
        
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const parsed = JSON.parse(cleanedResponse);
        
        return NextResponse.json({ questions: parsed.questions || [] });
    } catch (error) {
        console.error('Review test generation error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to generate review test' 
        }, { status: 500 });
    }
}
