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

    const { targetSchool, examDate, currentLevel, targetSubjects } = await request.json();

    if (!targetSchool || !examDate || !currentLevel || !targetSubjects) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const studyPlan = {
      totalWeeks: Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7)),
      weeklySchedule: targetSubjects.map((subject: string) => ({
        subject,
        hoursPerWeek: currentLevel === '基礎' ? 8 : currentLevel === '標準' ? 10 : 12,
        topics: [
          `${subject}の基礎復習`,
          `${subject}の応用問題`,
          `${subject}の過去問演習`
        ]
      })),
      milestones: [
        { week: 4, description: '基礎固め完了' },
        { week: 8, description: '応用力強化' },
        { week: 12, description: '過去問対策' }
      ]
    };

    const result = await query(`
      INSERT INTO goals (user_id, target_school, exam_date, current_level, target_subjects, study_plan)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE SET
        target_school = $2,
        exam_date = $3,
        current_level = $4,
        target_subjects = $5,
        study_plan = $6,
        updated_at = NOW()
      RETURNING *
    `, [session.userId, targetSchool, examDate, currentLevel, targetSubjects, JSON.stringify(studyPlan)]);

    return NextResponse.json({
      success: true,
      goal: result.rows[0],
      studyPlan
    });
  } catch (error) {
    console.error('Goal planner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = await query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ goal: null });
    }

    return NextResponse.json({ goal: result.rows[0] });
  } catch (error) {
    console.error('Get goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
