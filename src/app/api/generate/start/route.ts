import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addGenerateJob } from '@/lib/queue';
import { initializeWorker } from '@/lib/worker';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    initializeWorker();

    const { subject, grade, unit, difficulty } = await request.json();
    
    const jobId = await addGenerateJob(session.userId, { subject, grade, unit, difficulty });

    return NextResponse.json({ 
      jobId,
      status: 'started',
      message: 'Material generation started'
    });
  } catch (error) {
    console.error('Generate start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
