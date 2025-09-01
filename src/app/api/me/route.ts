import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    if (process.env.AUTH_DEV_BYPASS === '1') {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('auth_session')?.value;
      
      if (sessionToken) {
        try {
          const decoded = verify(sessionToken, process.env.LINE_CHANNEL_SECRET || 'dev-secret') as { userId: string; plan: string };
          if (decoded.userId === 'dev-user-id') {
            return NextResponse.json({
              id: 'dev-user-id',
              displayName: `Dev User (${(decoded.plan || 'free').toUpperCase()})`,
              plan: decoded.plan || 'free',
              paidUntil: null
            });
          }
        } catch (_error) {
        }
      }
    }

    const session = await getCurrentUser();
    if (!session) {
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('auth_session');
      console.warn('Authentication failed - Cookie status:', {
        hasCookie: !!authCookie,
        cookieName: authCookie ? 'auth_session' : 'none',
        allCookies: request.headers.get('cookie') || 'none'
      });
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT id, display_name, plan, paid_until FROM users WHERE id = $1',
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      id: user.id,
      displayName: user.display_name,
      plan: user.plan,
      paidUntil: user.paid_until
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
