import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { level } = await request.json();
    
    if (!level) {
      return NextResponse.json({ error: 'Level is required' }, { status: 400 });
    }

    const userResult = await query(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    
    if (['basic', 'standard'].includes(level)) {
      return NextResponse.json({ 
        allowed: true,
        level,
        plan: user.plan
      });
    }

    if (level === 'advanced' && user.plan !== 'plus') {
      return NextResponse.json({ 
        error: 'Advanced level requires PLUS subscription',
        allowed: false,
        level,
        plan: user.plan
      }, { status: 403 });
    }

    return NextResponse.json({ 
      allowed: true,
      level,
      plan: user.plan
    });
  } catch (error) {
    console.error('Quiz level validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
