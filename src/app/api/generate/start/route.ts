import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await request.json(); // content and difficulty for future use
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setTimeout(() => {
      console.log(`Generation job ${jobId} completed (dummy)`);
    }, 2000);

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
