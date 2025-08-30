import { NextRequest, NextResponse } from 'next/server';
import { verifyLineIdToken, createSessionToken } from '@/lib/auth';
import { createOrUpdateUser } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken, redirectTo } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const lineUser = await verifyLineIdToken(idToken);
    if (!lineUser) {
      return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
    }

    const user = await createOrUpdateUser(lineUser.sub, lineUser.name || '');
    const sessionToken = createSessionToken(user.id);

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ 
      success: true, 
      redirectTo: redirectTo || '/generator',
      user: {
        id: user.id,
        displayName: user.display_name,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
