import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

const GEN_MAX_PER_DAY = parseInt(process.env.GEN_MAX_PER_DAY || '10');
const NAVI_MAX_PER_DAY = parseInt(process.env.NAVI_MAX_PER_DAY || '3');

export async function GET() {
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
    
    if (user.plan === 'plus') {
      return NextResponse.json({
        gen_left: -1,
        navi_left: -1,
        today: new Date().toISOString().split('T')[0],
        unlimited: true
      });
    }

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    const usageResult = await query(
      'SELECT gen_count, navi_count FROM usage_logs WHERE user_id = $1 AND date = $2',
      [session.userId, today]
    );

    const usage = usageResult.rows[0] || { gen_count: 0, navi_count: 0 };

    return NextResponse.json({
      gen_left: Math.max(0, GEN_MAX_PER_DAY - usage.gen_count),
      navi_left: Math.max(0, NAVI_MAX_PER_DAY - usage.navi_count),
      today,
      unlimited: false
    });
  } catch (error) {
    console.error('Get limits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
