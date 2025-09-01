import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface LineIdToken {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  name?: string;
  picture?: string;
}

export async function verifyLineIdToken(idToken: string): Promise<LineIdToken | null> {
  try {
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.LINE_CHANNEL_ID!,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.aud !== process.env.LINE_CHANNEL_ID) {
      return null;
    }

    if (data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return data as LineIdToken;
  } catch (error) {
    console.error('ID token verification error:', error);
    return null;
  }
}

export function createSessionToken(userId: string): string {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    process.env.LINE_CHANNEL_SECRET!,
    { expiresIn: '7d' }
  );
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.LINE_CHANNEL_SECRET!) as { userId: string; iat: number };
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session')?.value;
  
  if (!sessionToken) {
    return null;
  }

  const session = verifySessionToken(sessionToken);
  if (!session) {
    return null;
  }

  return session;
}
