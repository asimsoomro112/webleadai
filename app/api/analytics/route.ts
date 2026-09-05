import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const analytics = appStore.getAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
