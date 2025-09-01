import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    liffId: process.env.NEXT_PUBLIC_LIFF_ID || 'undefined',
    channelId: process.env.LINE_CHANNEL_ID || 'undefined',
    cookieSameSite: process.env.COOKIE_SAMESITE || 'undefined',
    cookieSecure: process.env.COOKIE_SECURE || 'undefined',
    xForwardedProto: request.headers.get('x-forwarded-proto') || 'undefined',
    nodeEnv: process.env.NODE_ENV || 'undefined',
    timestamp: new Date().toISOString(),
  });
}
