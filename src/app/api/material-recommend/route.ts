import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(_request: NextRequest) {
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
        error: 'Material recommendation requires PLUS subscription',
        feature: 'material-recommend'
      }, { status: 403 });
    }

    const historyResult = await query(`
      SELECT subject, AVG(score) as avg_score, weak_areas
      FROM learning_history 
      WHERE user_id = $1 AND completed_at > NOW() - INTERVAL '30 days'
      GROUP BY subject, weak_areas
      ORDER BY avg_score ASC
    `, [session.userId]);

    const learningHistory = historyResult.rows;
    
    const recommendations = generateMaterialRecommendations(learningHistory);

    return NextResponse.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Material recommendation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateMaterialRecommendations(history: { subject: string; avg_score: number }[]) {
  const recommendations = [];
  
  if (history.length === 0) {
    recommendations.push({
      id: 'general-1',
      title: '基礎数学ドリル',
      subject: '数学',
      difficulty: '基礎',
      description: '数学の基本的な計算問題を集めた教材です。',
      url: 'https://example.com/math-basic',
      reason: '学習履歴がないため、基礎から始めることをお勧めします。'
    });
    recommendations.push({
      id: 'general-2',
      title: '英語基礎文法',
      subject: '英語',
      difficulty: '基礎',
      description: '英語の基本文法を学習できる教材です。',
      url: 'https://example.com/english-basic',
      reason: '学習履歴がないため、基礎から始めることをお勧めします。'
    });
  } else {
    history.forEach((item, index) => {
      if (item.avg_score < 70) {
        recommendations.push({
          id: `weak-${index}`,
          title: `${item.subject}強化教材`,
          subject: item.subject,
          difficulty: '基礎〜標準',
          description: `${item.subject}の苦手分野を重点的に学習できる教材です。`,
          url: `https://example.com/${item.subject.toLowerCase()}-review`,
          reason: `${item.subject}の平均点が${Math.round(item.avg_score)}点と低いため、復習をお勧めします。`
        });
      }
    });
  }

  return recommendations.slice(0, 6);
}
