import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userResult = await query(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    if (user.plan !== 'plus') {
      return NextResponse.json({ 
        error: 'Challenge Match requires PLUS subscription',
        feature: 'challenge-match'
      }, { status: 403 });
    }

    const { difficulty, subject, questionCount } = await request.json();

    if (!difficulty || !subject || !questionCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const questions = Array.from({ length: questionCount }, (_, index) => ({
      id: index + 1,
      question: `${subject}の${difficulty}レベル問題 ${index + 1}`,
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
      VALUES ($1, $2, 'challenge_match', $3, $4)
      RETURNING id
    `, [session.userId, subject, difficulty, questionCount]);

    return NextResponse.json({
      success: true,
      quizId: historyResult.rows[0].id,
      questions,
      timeLimit: difficulty === '初級' ? 600 : difficulty === '中級' ? 900 : 1200 // seconds
    });
  } catch (error) {
    console.error('Challenge match error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { quizId, answers, timeSpent } = await request.json();

    if (!quizId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const correctAnswers = answers.filter((answer: any) => answer.isCorrect).length;
    const totalQuestions = answers.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    const weakAreas = answers
      .filter((answer: any) => !answer.isCorrect)
      .map((answer: any) => answer.topic)
      .filter((topic: string, index: number, arr: string[]) => arr.indexOf(topic) === index);

    await query(`
      UPDATE learning_history 
      SET score = $1, weak_areas = $2, completed_at = NOW()
      WHERE id = $3 AND user_id = $4
    `, [score, JSON.stringify(weakAreas), quizId, session.userId]);

    return NextResponse.json({
      success: true,
      score,
      correctAnswers,
      totalQuestions,
      weakAreas,
      timeSpent,
      performance: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs_improvement'
    });
  } catch (error) {
    console.error('Challenge match submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
