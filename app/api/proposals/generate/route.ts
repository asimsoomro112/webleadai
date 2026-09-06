import { NextRequest, NextResponse } from 'next/server';
import { generateProposalDoc } from '@/lib/gemini';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings, tier = 'PROFESSIONAL', priceOverride } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required' }, { status: 400 });
    }

    const proposal = await withUserGeminiPool(authResult.uid, () => generateProposalDoc({
      lead,
      profile: settings.profile,
      tier,
      priceOverride,
    }));

    const updatedProposals = [proposal, ...(lead.proposals || [])];
    const updatedLead = {
      ...lead,
      proposals: updatedProposals,
      status: lead.status === 'INTERESTED' || lead.status === 'CALL_BOOKED' ? 'PROPOSAL_SENT' : lead.status,
      dealValue: proposal.totalPrice,
    };

    const newActivity = {
      id: `act_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'PROPOSAL_CREATED',
      title: `Generated ${tier} Web Proposal ($${proposal.totalPrice})`,
      details: `Included ${proposal.scopeFeatures.length} tailored deliverables and ${proposal.timelineWeeks}-week timeline.`,
    };
    
    updatedLead.activities = [newActivity, ...(updatedLead.activities || [])];

    return NextResponse.json({ success: true, proposal, lead: updatedLead });
  } catch (error: any) {
    console.error('Error generating proposal:', error);
    return NextResponse.json({ error: error?.message || 'Proposal generation failed' }, { status: 500 });
  }
}
