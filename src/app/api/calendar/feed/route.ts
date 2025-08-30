import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUpcomingEvents } from '@/lib/gcal';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    const events = await getUpcomingEvents(maxResults);
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar feed error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}
