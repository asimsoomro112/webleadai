import { NextRequest, NextResponse } from 'next/server';
import { researchBusinessDeep } from '@/lib/gemini';
import { calculateLeadScore } from '@/lib/scorer';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required payload' }, { status: 400 });
    }

    const research = await researchBusinessDeep(lead);

    const scoreBreakdown = calculateLeadScore(
      {
        ...lead,
        websiteAudit: research.websiteAudit,
        growthSignals: research.growthSignals,
      },
      settings.scoringWeights
    );

    const updatedLead = {
      ...lead,
      painPoints: research.painPoints,
      growthSignals: research.growthSignals,
      recommendedService: research.recommendedService,
      recommendedPrice: research.recommendedPrice,
      websiteAudit: research.websiteAudit,
      competitorGap: research.competitorGap,
      scoreBreakdown,
      dealValue: research.recommendedPrice,
      status: lead.status === 'NEW' ? 'QUALIFIED' : lead.status,
    };

    const newActivity = {
      id: `act_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'RESEARCHED',
      title: 'Deep AI Audit & Research Completed',
      details: `Discovered ${research.painPoints?.length || 0} pain points. Recommended offer: ${research.recommendedService} ($${research.recommendedPrice}).`,
    };

    updatedLead.activities = [newActivity, ...(updatedLead.activities || [])];

    return NextResponse.json({ success: true, lead: updatedLead, research });
  } catch (error: any) {
    console.error('Error conducting lead research:', error);
    return NextResponse.json({ error: error?.message || 'Research failed' }, { status: 500 });
  }
}
