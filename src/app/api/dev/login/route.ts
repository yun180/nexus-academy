import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  if (process.env.AUTH_DEV_BYPASS !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan') || 'free';

  if (!['free', 'plus'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    const devUserId = 'dev-user-id';
    const lineUserId = 'dev-user';
    const displayName = `Dev User (${plan.toUpperCase()})`;

    const token = sign(
      { userId: devUserId, plan, iat: Math.floor(Date.now() / 1000) },
      process.env.LINE_CHANNEL_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      user: { plan, displayName },
      message: `Development login successful as ${plan.toUpperCase()} user`
    });

    response.cookies.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
