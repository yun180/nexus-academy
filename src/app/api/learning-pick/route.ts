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
        error: 'Learning Pick requires PLUS subscription',
        feature: 'learning-pick'
      }, { status: 403 });
    }

    const historyResult = await query(`
      SELECT subject, weak_areas, score, quiz_type, completed_at
      FROM learning_history 
      WHERE user_id = $1 
      ORDER BY completed_at DESC 
      LIMIT 50
    `, [session.userId]);

    const learningHistory = historyResult.rows;
    
    const weaknessAnalysis = analyzeLearningHistory(learningHistory);
    const recommendations = generateRecommendations(weaknessAnalysis);

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    await query(`
      INSERT INTO usage_logs (user_id, date, learning_pick_count)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, date)
      DO UPDATE SET learning_pick_count = usage_logs.learning_pick_count + 1
    `, [session.userId, today]);

    return NextResponse.json({
      success: true,
      analysis: weaknessAnalysis,
      recommendations
    });
  } catch (error) {
    console.error('Learning pick error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const historyResult = await query(`
      SELECT 
        subject,
        COUNT(*) as attempt_count,
        AVG(score) as avg_score,
        MAX(completed_at) as last_attempt
      FROM learning_history 
      WHERE user_id = $1 AND completed_at > NOW() - INTERVAL '30 days'
      GROUP BY subject
      ORDER BY last_attempt DESC
    `, [session.userId]);

    return NextResponse.json({
      summary: historyResult.rows.map(row => ({
        subject: row.subject,
        attemptCount: parseInt(row.attempt_count),
        averageScore: Math.round(parseFloat(row.avg_score) || 0),
        lastAttempt: row.last_attempt
      }))
    });
  } catch (error) {
    console.error('Get learning summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function analyzeLearningHistory(history: Array<{ subject: string; score: number; weak_areas: string | null }>) {
  const subjectAnalysis: { [key: string]: { totalAttempts: number; totalScore: number; weakAreas: Set<string>; recentScores: number[] } } = {};
  
  history.forEach(record => {
    const subject = record.subject;
    if (!subjectAnalysis[subject]) {
      subjectAnalysis[subject] = {
        totalAttempts: 0,
        totalScore: 0,
        weakAreas: new Set(),
        recentScores: []
      };
    }
    
    subjectAnalysis[subject].totalAttempts++;
    subjectAnalysis[subject].totalScore += record.score || 0;
    subjectAnalysis[subject].recentScores.push(record.score || 0);
    
    if (record.weak_areas) {
      try {
        const weakAreas = typeof record.weak_areas === 'string' 
          ? JSON.parse(record.weak_areas) 
          : record.weak_areas;
        
        if (Array.isArray(weakAreas)) {
          weakAreas.forEach(area => subjectAnalysis[subject].weakAreas.add(area));
        } else if (weakAreas.incorrectParts) {
          weakAreas.incorrectParts.forEach((part: string) => 
            subjectAnalysis[subject].weakAreas.add(part)
          );
        }
      } catch (_e) {
      }
    }
  });
  
  const analysis = Object.entries(subjectAnalysis).map(([subject, data]) => {
    const avgScore = data.totalScore / data.totalAttempts;
    const recentAvg = data.recentScores.slice(-5).reduce((a: number, b: number) => a + b, 0) / Math.min(5, data.recentScores.length);
    
    return {
      subject,
      averageScore: Math.round(avgScore),
      recentAverageScore: Math.round(recentAvg),
      totalAttempts: data.totalAttempts,
      weakAreas: Array.from(data.weakAreas).slice(0, 5),
      trend: recentAvg > avgScore ? 'improving' : recentAvg < avgScore ? 'declining' : 'stable',
      needsAttention: avgScore < 70 || recentAvg < 60
    };
  });
  
  return analysis.sort((a, b) => {
    if (a.needsAttention && !b.needsAttention) return -1;
    if (!a.needsAttention && b.needsAttention) return 1;
    return a.averageScore - b.averageScore;
  });
}

function generateRecommendations(analysis: Array<{ subject: string; averageScore: number; needsAttention: boolean; trend: string; weakAreas: string[] }>) {
  const recommendations = [];
  
  analysis.forEach(subject => {
    if (subject.needsAttention) {
      recommendations.push({
        type: 'urgent',
        subject: subject.subject,
        title: `${subject.subject}の基礎固めが必要です`,
        description: `平均点が${subject.averageScore}点と低めです。基礎的な問題から復習しましょう。`,
        actions: [
          '基礎レベルの問題集を解く',
          'ソリューションナビで疑問点を質問する',
          '毎日30分の復習時間を確保する'
        ],
        priority: 'high'
      });
    } else if (subject.trend === 'declining') {
      recommendations.push({
        type: 'warning',
        subject: subject.subject,
        title: `${subject.subject}の成績が下降気味です`,
        description: '最近の成績が以前より下がっています。早めの対策をおすすめします。',
        actions: [
          '間違えた問題の復習',
          'チャレンジマッチで実力確認',
          '苦手分野の集中学習'
        ],
        priority: 'medium'
      });
    } else if (subject.averageScore >= 80) {
      recommendations.push({
        type: 'advancement',
        subject: subject.subject,
        title: `${subject.subject}は順調です！さらなる向上を`,
        description: '良い成績を維持しています。より高いレベルに挑戦してみましょう。',
        actions: [
          '応用レベルの問題に挑戦',
          '他の科目の学習時間を増やす',
          '教材生成で発展問題を作成'
        ],
        priority: 'low'
      });
    }
    
    if (subject.weakAreas.length > 0) {
      recommendations.push({
        type: 'specific',
        subject: subject.subject,
        title: `${subject.subject}の苦手分野対策`,
        description: `特に${subject.weakAreas.slice(0, 2).join('、')}の理解を深めましょう。`,
        actions: [
          `${subject.weakAreas[0]}に関する基礎問題を解く`,
          'アンサーチェッカーで理解度確認',
          'ゴールプランナーで学習計画を調整'
        ],
        priority: 'medium'
      });
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'general',
      subject: '全般',
      title: '学習状況は良好です',
      description: '現在の学習ペースを維持し、さらなる向上を目指しましょう。',
      actions: [
        '新しい分野への挑戦',
        '定期的な復習の継続',
        '学習目標の見直し'
      ],
      priority: 'low'
    });
  }
  
  return recommendations.slice(0, 6); // Limit to 6 recommendations
}
