import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createEvent } from '@/lib/gcal';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { start, end, topic, attendeeEmail } = await request.json();
    
    if (!start || !end || !topic || !attendeeEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: start, end, topic, attendeeEmail' 
      }, { status: 400 });
    }

    const result = await createEvent({
      title: `NEXUS オンライン教室: ${topic}`,
      start,
      end,
      attendees: [{ email: attendeeEmail }],
      description: `トピック: ${topic}\n\nNEXUS ACADEMY オンライン教室セッション`
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Classroom booking error:', error);
    return NextResponse.json({ error: 'Failed to book classroom session' }, { status: 500 });
  }
}
