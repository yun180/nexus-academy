import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

const GEN_MAX_PER_DAY = parseInt(process.env.GEN_MAX_PER_DAY || '10');
const NAVI_MAX_PER_DAY = parseInt(process.env.NAVI_MAX_PER_DAY || '3');

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { type } = await request.json();
    
    if (!type || !['gen', 'navi'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "gen" or "navi"' }, { status: 400 });
    }

    const userResult = await query(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    
    if (user.plan === 'plus') {
      return NextResponse.json({ success: true, unlimited: true });
    }

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    const usageResult = await query(
      'SELECT gen_count, navi_count FROM usage_logs WHERE user_id = $1 AND date = $2',
      [session.userId, today]
    );

    const currentUsage = usageResult.rows[0] || { gen_count: 0, navi_count: 0 };
    
    const maxLimit = type === 'gen' ? GEN_MAX_PER_DAY : NAVI_MAX_PER_DAY;
    const currentCount = type === 'gen' ? currentUsage.gen_count : currentUsage.navi_count;
    
    if (currentCount >= maxLimit) {
      return NextResponse.json({ 
        error: `Daily limit exceeded. ${type === 'gen' ? 'Material generation' : 'Solution navigator'} limit is ${maxLimit} per day.`,
        limit_exceeded: true,
        current_count: currentCount,
        max_limit: maxLimit
      }, { status: 400 });
    }

    if (usageResult.rows.length === 0) {
      await query(
        `INSERT INTO usage_logs (user_id, date, ${type}_count) VALUES ($1, $2, 1)`,
        [session.userId, today]
      );
    } else {
      await query(
        `UPDATE usage_logs SET ${type}_count = ${type}_count + 1 WHERE user_id = $1 AND date = $2`,
        [session.userId, today]
      );
    }

    return NextResponse.json({ 
      success: true, 
      new_count: currentCount + 1,
      remaining: maxLimit - (currentCount + 1)
    });
  } catch (error) {
    console.error('Increment usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
