import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const { id } = await params;
    const lead = appStore.getLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error getting lead:', error);
    return NextResponse.json({ error: 'Failed to retrieve lead' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const { id } = await params;
    const body = await req.json();
    const updated = appStore.updateLead(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ lead: updated, success: true });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const { id } = await params;
    const deleted = appStore.deleteLead(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
