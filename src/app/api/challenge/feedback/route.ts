import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '../../../../lib/ai-providers';
import { Question } from '../../../challenge/types';

export async function POST(request: NextRequest) {
    try {
        const { questions, userAnswers }: { questions: Question[], userAnswers: string[] } = await request.json();
        const aiProvider = getAIProvider();

        const feedbackPromises = questions.map(async (question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

            let explanation = "正解です！素晴らしい！";
            if (!isCorrect) {
                const prompt = `
                    生徒が問題を間違えました。解答を分析し、解説を提供してください。
                    - 問題: "${question.questionText}"
                    - 学習タグ: ${question.tags.join(', ')}
                    - 正解: "${question.correctAnswer}"
                    - 生徒の誤答: "${userAnswer}"
                    
                    なぜ生徒の解答が間違っているのか、どの概念を誤解している可能性があるのかを説明し、正しい考え方に導いてください。
                    
                    回答は以下のJSON形式で返してください:
                    {
                      "explanation": "詳細な解説"
                    }
                `;
                
                const systemPrompt = "あなたは教育専門のAIアシスタントです。生徒の間違いを分析し、建設的なフィードバックを提供してください。";
                
                try {
                    const response = await aiProvider.generateContent(prompt, systemPrompt);
                    
                    let cleanedResponse = response.trim();
                    if (cleanedResponse.startsWith('```json')) {
                        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    } else if (cleanedResponse.startsWith('```')) {
                        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
                    }
                    
                    const parsed = JSON.parse(cleanedResponse);
                    explanation = parsed.explanation || "この解答に対する詳細な解説を生成できませんでした。";
                } catch (e) {
                    console.error("Failed to parse feedback response:", e);
                    explanation = "この解答に対する詳細な解説を生成できませんでした。"
                }
            }
            
            return { question, userAnswer, isCorrect, explanation };
        });

        const feedback = await Promise.all(feedbackPromises);
        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('Feedback generation error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to generate feedback' 
        }, { status: 500 });
    }
}
