import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const status = appStore.getAgentStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching agent status:', error);
    return NextResponse.json({ error: 'Failed to get agent status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { action } = body; // 'START' | 'PAUSE' | 'STOP'

    if (action === 'START') {
      appStore.setAgentStatus('RUNNING');
      appStore.addTask({
        type: 'DISCOVER',
        status: 'RUNNING',
        description: 'Autonomous discovery agent started. Monitoring target sectors...',
        progress: 10,
      });
    } else if (action === 'PAUSE') {
      appStore.setAgentStatus('PAUSED');
    } else if (action === 'STOP') {
      appStore.setAgentStatus('IDLE');
    }

    return NextResponse.json({ success: true, ...appStore.getAgentStatus() });
  } catch (error) {
    console.error('Error controlling agent:', error);
    return NextResponse.json({ error: 'Failed to control agent' }, { status: 500 });
  }
}
