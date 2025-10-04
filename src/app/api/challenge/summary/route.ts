import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '../../../../lib/ai-providers';

export async function POST(request: NextRequest) {
    try {
        const { accuracy, timeTaken, incorrectTags }: { 
            accuracy: number, 
            timeTaken: number, 
            incorrectTags: string[] 
        } = await request.json();
        
        const aiProvider = getAIProvider();

        const prompt = `
            生徒が実力テストを完了しました。以下が成績データです:
            - 正答率: ${accuracy.toFixed(1)}%
            - 解答時間 (秒): ${timeTaken}
            - 要復習のトピック (誤答に基づく): ${incorrectTags.length > 0 ? incorrectTags.join(', ') : 'なし、素晴らしいです！'}

            生徒の成績について、励みになるような短い総評を提供してください。その後、復習が必要なトピックに基づいて、学習計画のための明確で実行可能な次のステップを2〜3個提案してください。提案は簡潔にしてください。
        `;

        const systemPrompt = "あなたは教育専門のAIアシスタントです。生徒の成績を分析し、建設的で励みになるフィードバックを提供してください。";
        const response = await aiProvider.generateContent(prompt, systemPrompt);

        return NextResponse.json({ summary: response });
    } catch (error) {
        console.error('Summary generation error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to generate summary' 
        }, { status: 500 });
    }
}
