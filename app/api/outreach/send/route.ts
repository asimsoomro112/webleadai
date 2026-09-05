import { NextRequest, NextResponse } from 'next/server';
import { OutreachChannel } from '@/lib/types';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings, analytics, channel = 'WHATSAPP', messageText, stepIndex = 0 } = body;

    if (!lead || !settings || !analytics) {
      return NextResponse.json({ error: 'Lead, Settings, and Analytics are required' }, { status: 400 });
    }

    // Check daily rate limits
    if (analytics.contactedCount >= settings.dailyOutreachLimit) {
      return NextResponse.json(
        { error: `Daily outreach limit reached (${settings.dailyOutreachLimit} messages/day) for compliance.` },
        { status: 429 }
      );
    }

    // Update follow-up sequence step
    const updatedSequence = [...(lead.followUpSequence || [])];
    if (updatedSequence[stepIndex]) {
      updatedSequence[stepIndex] = {
        ...updatedSequence[stepIndex],
        status: 'SENT',
        sentAt: new Date().toISOString(),
      };
    }

    // Calculate next scheduled follow-up
    const nextFollowUpDate = new Date();
    nextFollowUpDate.setDate(nextFollowUpDate.getDate() + 3);

    const updatedLead = {
      ...lead,
      status: 'CONTACTED',
      lastContactedAt: new Date().toISOString(),
      nextFollowUpAt: nextFollowUpDate.toISOString(),
      followUpSequence: updatedSequence,
      primaryChannel: channel as OutreachChannel,
    };

    const newActivity = {
      id: `act_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'CONTACTED',
      title: `Outreach Sent via ${channel}`,
      details: messageText ? `Message preview: "${messageText.substring(0, 80)}..."` : 'Sent personalized outreach.',
    };

    updatedLead.activities = [newActivity, ...(updatedLead.activities || [])];

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      status: 'SUCCESS',
      message: `Outreach recorded via ${channel}. Compliant next follow-up scheduled for ${nextFollowUpDate.toLocaleDateString()}.`,
    });
  } catch (error: any) {
    console.error('Error sending outreach:', error);
    return NextResponse.json({ error: error?.message || 'Outreach failed' }, { status: 500 });
  }
}
