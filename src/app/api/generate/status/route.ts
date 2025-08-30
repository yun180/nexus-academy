import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const isCompleted = Math.random() > 0.3;
    
    if (isCompleted) {
      return NextResponse.json({
        status: 'completed',
        result: {
          title: 'サンプル教材',
          content: 'これはダミーの生成結果です。実際の実装では、AIが生成した教材がここに表示されます。',
          difficulty: '基礎',
          questions: [
            {
              question: 'サンプル問題1',
              options: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
              correct: 0
            }
          ]
        }
      });
    } else {
      return NextResponse.json({
        status: 'processing',
        progress: Math.floor(Math.random() * 80) + 10
      });
    }
  } catch (error) {
    console.error('Generate status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
