import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

const GEN_MAX_PER_DAY = parseInt(process.env.GEN_MAX_PER_DAY || '10');
const NAVI_MAX_PER_DAY = parseInt(process.env.NAVI_MAX_PER_DAY || '3');

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();
    
    if (!type || !['gen', 'navi'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "gen" or "navi"' }, { status: 400 });
    }

    if (process.env.AUTH_DEV_BYPASS === '1') {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('auth_session')?.value;
      
      if (sessionToken) {
        try {
          const decoded = verify(sessionToken, process.env.LINE_CHANNEL_SECRET || 'dev-secret') as { userId: string; plan: string };
          if (decoded.userId === 'dev-user-id') {
            return NextResponse.json({ success: true, unlimited: true });
          }
        } catch (_error) {
        }
      }
    }

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

    return NextResponse.json({ success: true, unlimited: true });
  } catch (error) {
    console.error('Increment usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
