import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';
import { createOrUpdateUser } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      console.error('Missing idToken in request');
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.LINE_CHANNEL_ID!,
      }),
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('LINE Verify API failed:', {
        status: verifyResponse.status,
        statusText: verifyResponse.statusText,
        body: errorText
      });
      return NextResponse.json({ 
        error: `LINE verification failed: ${verifyResponse.status} ${verifyResponse.statusText} - ${errorText}` 
      }, { status: 401 });
    }

    const profile = await verifyResponse.json();
    console.log('LINE Verify API success:', { sub: profile.sub, name: profile.name });

    const user = await createOrUpdateUser(profile.sub, profile.name || '');
    const sessionToken = createSessionToken(user.id);

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ 
      ok: true,
      user: {
        id: user.id,
        name: user.display_name,
        picture: profile.picture || null
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
