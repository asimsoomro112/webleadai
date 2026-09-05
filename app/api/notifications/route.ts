import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const notifications = appStore.getNotifications();
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { action, id } = body;

    if (action === 'MARK_READ' && id) {
      appStore.markNotificationRead(id);
    } else if (action === 'MARK_ALL_READ') {
      appStore.markAllNotificationsRead();
    }

    return NextResponse.json({ success: true, notifications: appStore.getNotifications() });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
