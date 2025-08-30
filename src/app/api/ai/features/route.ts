import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { featureId } = await request.json();
    
    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    const userResult = await query(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    
    if (featureId === 'solution-navi') {
      return NextResponse.json({ 
        allowed: true,
        feature: featureId,
        plan: user.plan
      });
    }

    if (user.plan !== 'plus') {
      return NextResponse.json({ 
        error: 'This feature requires PLUS subscription',
        allowed: false,
        feature: featureId,
        plan: user.plan
      }, { status: 403 });
    }

    return NextResponse.json({ 
      allowed: true,
      feature: featureId,
      plan: user.plan
    });
  } catch (error) {
    console.error('AI feature validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
