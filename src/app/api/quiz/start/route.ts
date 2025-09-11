import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { level, subject, questionCount } = await request.json();

    if (!level || !subject || !questionCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userResult = await query(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    
    if (level === 'advanced' && user.plan !== 'plus') {
      return NextResponse.json({ 
        error: 'Advanced level requires PLUS subscription',
        feature: 'quiz-advanced'
      }, { status: 403 });
    }

    const questions = Array.from({ length: questionCount }, (_, index) => ({
      id: index + 1,
      question: `${subject}の${level}レベル問題 ${index + 1}`,
      options: [
        '選択肢A',
        '選択肢B', 
        '選択肢C',
        '選択肢D'
      ],
      correct: Math.floor(Math.random() * 4),
      explanation: `この問題の解説です。${subject}の基本的な概念を理解していれば解ける問題です。`
    }));

    const historyResult = await query(`
      INSERT INTO learning_history (user_id, subject, quiz_type, difficulty, max_score)
      VALUES ($1, $2, 'basic_quiz', $3, $4)
      RETURNING id
    `, [session.userId, subject, level, questionCount]);

    return NextResponse.json({
      success: true,
      quizId: historyResult.rows[0].id,
      questions
    });
  } catch (error) {
    console.error('Quiz start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
