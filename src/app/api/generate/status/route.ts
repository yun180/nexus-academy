import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getJobStatus } from '@/lib/queue';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const jobStatus = await getJobStatus(jobId);
    return NextResponse.json(jobStatus);
  } catch (error) {
    console.error('Generate status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
