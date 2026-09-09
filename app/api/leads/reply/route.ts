import { NextRequest, NextResponse } from 'next/server';
import { generateEmailReply } from '@/lib/gemini';
import { PipelineStatus } from '@/lib/types';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings, action, objection } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required' }, { status: 400 });
    }

    const analysisResult = await withUserGeminiPool(
      authResult.uid,
      () => generateEmailReply(lead, settings.profile, action, objection),
    );

    const {
      reply,
      suggestedStatus,
      classifiedIntent = 'GENERAL_INQUIRY',
      voiceNoteScript,
      salesClosingTip,
      actionableStep,
    } = analysisResult;

    let nextStatus: PipelineStatus = lead.status;
    if (suggestedStatus === 'positive') nextStatus = 'INTERESTED';
    if (suggestedStatus === 'negative') nextStatus = 'LOST';
    if (suggestedStatus === 'objection') nextStatus = 'OBJECTION_HANDLING';

    const incomingText = objection || (action === 'accept' ? 'Yes, I am interested.' : action === 'reject' ? 'No thanks.' : 'Can you tell me more?');

    const newReply = {
      id: `msg_${Date.now()}`,
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      sender: 'lead',
      content: incomingText,
      messageText: incomingText,
      replyDraft: reply,
      voiceNoteScript,
      classifiedIntent,
    };

    const updatedSequence = [...(lead.followUpSequence || [])];
    const lastPendingIdx = updatedSequence.findIndex((s) => s.status === 'PENDING');
    if (lastPendingIdx >= 0) {
      updatedSequence[lastPendingIdx].status = 'REPLIED';
      updatedSequence[lastPendingIdx].repliedAt = new Date().toISOString();
    }

    // Update conversationMemory
    const existingMessages = lead.conversationMemory?.messages || [];
    const updatedConversationMemory = {
      leadId: lead.id,
      summary: `Prospect replied: "${incomingText.slice(0, 60)}...". Intent: ${classifiedIntent}. Suggested status: ${nextStatus}.`,
      lastContactedAt: new Date().toISOString(),
      messages: [
        ...existingMessages,
        {
          id: `msg_conv_${Date.now()}`,
          sender: 'PROSPECT' as const,
          channel: lead.primaryChannel || 'WHATSAPP',
          messageText: incomingText,
          timestamp: new Date().toISOString(),
          intentClassified: classifiedIntent,
        },
      ],
    };

    const updatedLead = {
      ...lead,
      status: nextStatus,
      followUpSequence: updatedSequence,
      inbox: [...(lead.inbox || []), newReply],
      conversationMemory: updatedConversationMemory,
    };

    const newActivity = {
      id: `act_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'REPLY_RECEIVED',
      title: `Prospect Reply Ingested (${classifiedIntent.replace(/_/g, ' ')})`,
      details: `Intent: ${classifiedIntent}. Counter-pitch and WhatsApp voice-note script prepared. Next stage: ${nextStatus}.`,
    };
    updatedLead.activities = [newActivity, ...(updatedLead.activities || [])];

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      replyDraft: reply,
      voiceNoteScript,
      classifiedIntent,
      salesClosingTip,
      actionableStep,
    });
  } catch (error: any) {
    console.error('Error handling reply:', error);
    return NextResponse.json({ error: error?.message || 'Reply handling failed' }, { status: 500 });
  }
}
