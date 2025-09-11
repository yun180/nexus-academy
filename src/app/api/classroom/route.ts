import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { createEvent } from '@/lib/gcal';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { title, sessionType, startTime, endTime, attendeeEmails } = await request.json();

    if (!title || !sessionType || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userResult = await query(
      'SELECT display_name FROM users WHERE id = $1',
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    const attendees = [
      { email: 'instructor@nexus-academy.com', name: 'NEXUS ACADEMY 講師' }
    ];

    if (attendeeEmails && Array.isArray(attendeeEmails)) {
      attendees.push(...attendeeEmails.map((email: string) => ({ email, name: '' })));
    }

    const calendarEvent = await createEvent({
      title: `${title} - NEXUS ACADEMY`,
      start: startTime,
      end: endTime,
      attendees,
      description: `
オンライン授業: ${title}
授業タイプ: ${sessionType === 'group' ? 'グループ授業' : '個別指導'}
受講者: ${user.display_name}

※ 授業開始時刻の5分前にはMeetに参加してください。
※ 資料や宿題は授業後にお送りします。
      `.trim()
    });

    const sessionResult = await query(`
      INSERT INTO class_sessions (
        user_id, title, session_type, start_time, end_time, 
        google_event_id, meet_url, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING *
    `, [
      session.userId,
      title,
      sessionType,
      startTime,
      endTime,
      calendarEvent.eventId,
      calendarEvent.meetUrl
    ]);

    return NextResponse.json({
      success: true,
      session: {
        id: sessionResult.rows[0].id,
        title: sessionResult.rows[0].title,
        sessionType: sessionResult.rows[0].session_type,
        startTime: sessionResult.rows[0].start_time,
        endTime: sessionResult.rows[0].end_time,
        meetUrl: sessionResult.rows[0].meet_url,
        status: sessionResult.rows[0].status
      },
      calendarEvent: {
        eventId: calendarEvent.eventId,
        eventUrl: calendarEvent.eventUrl,
        meetUrl: calendarEvent.meetUrl
      }
    });
  } catch (error) {
    console.error('Classroom booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause = 'WHERE user_id = $1';
    const params = [session.userId];

    if (status !== 'all') {
      whereClause += ' AND status = $2';
      params.push(status);
    }

    const result = await query(`
      SELECT id, title, session_type, start_time, end_time, meet_url, status, notes, created_at
      FROM class_sessions 
      ${whereClause}
      ORDER BY start_time DESC 
      LIMIT ${limit}
    `, params);

    return NextResponse.json({
      sessions: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        sessionType: row.session_type,
        startTime: row.start_time,
        endTime: row.end_time,
        meetUrl: row.meet_url,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get classroom sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { sessionId, status, notes } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (status) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(sessionId, session.userId);

    const result = await query(`
      UPDATE class_sessions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        sessionType: result.rows[0].session_type,
        startTime: result.rows[0].start_time,
        endTime: result.rows[0].end_time,
        meetUrl: result.rows[0].meet_url,
        status: result.rows[0].status,
        notes: result.rows[0].notes
      }
    });
  } catch (error) {
    console.error('Update classroom session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
