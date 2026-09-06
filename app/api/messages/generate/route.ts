import { NextRequest, NextResponse } from 'next/server';
import { generatePersonalizedOutreach } from '@/lib/gemini';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required payload' }, { status: 400 });
    }

    const outreach = await withUserGeminiPool(authResult.uid, () => generatePersonalizedOutreach(lead, settings.profile));

    const updatedLead = {
      ...lead,
      generatedSubject: outreach.subject,
      generatedMessage: outreach.initialMessage,
      followUpSequence: outreach.followUpSequence,
      status: lead.status === 'NEW' || lead.status === 'QUALIFIED' ? 'MESSAGE_READY' : lead.status,
    };

    const newActivity = {
      id: `act_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'MESSAGE_GENERATED',
      title: 'AI Personalized Outreach & 4-Step Sequence Generated',
      details: `Subject: "${outreach.subject}". Tailored to ${lead.category || 'business'} pain points with portfolio integration.`,
    };

    updatedLead.activities = [newActivity, ...(updatedLead.activities || [])];

    return NextResponse.json({ success: true, lead: updatedLead, outreach });
  } catch (error: any) {
    console.error('Error generating outreach:', error);
    return NextResponse.json({ error: error?.message || 'Message generation failed' }, { status: 500 });
  }
}
