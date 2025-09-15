import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.AUTH_DEV_BYPASS !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response = NextResponse.json({
    success: true,
    message: 'Development logout successful'
  });

  response.cookies.delete('auth_session');

  return response;
}
