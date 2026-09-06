import { NextRequest, NextResponse } from 'next/server';
import { generateProjectHandoff } from '@/lib/gemini';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings, instructions } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required' }, { status: 400 });
    }

    const handoff = await withUserGeminiPool(authResult.uid, () => generateProjectHandoff(lead, settings.profile, instructions));

    const updatedLead = {
      ...lead,
      projectHandoff: handoff,
    };

    const newActivity = {
      id: `act_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'PROJECT_HANDOFF',
      title: 'Project Handoff Brief Generated',
      details: `Generated technical specs and scope for fulfillment team.`,
    };
    updatedLead.activities = [newActivity, ...(updatedLead.activities || [])];

    return NextResponse.json({ success: true, lead: updatedLead, handoff });
  } catch (error: any) {
    console.error('Error generating handoff:', error);
    return NextResponse.json({ error: error?.message || 'Handoff generation failed' }, { status: 500 });
  }
}
