import { NextRequest, NextResponse } from 'next/server';
import { generateEmailReply } from '@/lib/gemini';
import { PipelineStatus } from '@/lib/types';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings, action, objection } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required' }, { status: 400 });
    }

    const { reply, suggestedStatus } = await generateEmailReply(lead, settings.profile, action, objection);

    let nextStatus: PipelineStatus = lead.status;
    if (suggestedStatus === 'positive') nextStatus = 'INTERESTED';
    if (suggestedStatus === 'negative') nextStatus = 'LOST';
    if (suggestedStatus === 'objection') nextStatus = 'CONTACTED';

    const newReply = {
      id: `msg_${Date.now()}`,
      date: new Date().toISOString(),
      sender: 'lead',
      content: action === 'accept' ? 'Yes, I am interested.' : action === 'reject' ? 'No thanks.' : objection || 'I have some concerns.',
      replyDraft: reply,
    };

    const updatedSequence = [...(lead.followUpSequence || [])];
    const lastPendingIdx = updatedSequence.findIndex((s) => s.status === 'PENDING');
    if (lastPendingIdx >= 0) {
      updatedSequence[lastPendingIdx].status = 'REPLIED';
      updatedSequence[lastPendingIdx].repliedAt = new Date().toISOString();
    }

    const updatedLead = {
      ...lead,
      status: nextStatus,
      followUpSequence: updatedSequence,
      inbox: [...(lead.inbox || []), newReply],
    };

    const newActivity = {
      id: `act_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'REPLY_RECEIVED',
      title: 'Simulated Lead Reply Received',
      details: `Intent analyzed as ${suggestedStatus.toUpperCase()}. Drafted counter-response.`,
    };
    updatedLead.activities = [newActivity, ...(updatedLead.activities || [])];

    return NextResponse.json({ success: true, lead: updatedLead, replyDraft: reply });
  } catch (error: any) {
    console.error('Error handling reply:', error);
    return NextResponse.json({ error: error?.message || 'Reply handling failed' }, { status: 500 });
  }
}
