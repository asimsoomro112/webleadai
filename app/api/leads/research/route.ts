import { NextRequest, NextResponse } from 'next/server';
import { researchBusinessDeep } from '@/lib/gemini';
import { calculateLeadScore } from '@/lib/scorer';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';
import { probeWebsiteLive } from '@/lib/live-web-probe';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required payload' }, { status: 400 });
    }

    // Run deep AI research and real HTTP probe in parallel if websiteUrl exists
    const [research, liveProbe] = await Promise.all([
      withUserGeminiPool(authResult.uid, () => researchBusinessDeep(lead)),
      lead.websiteUrl ? probeWebsiteLive(lead.websiteUrl) : Promise.resolve(null),
    ]);

    // Merge real measured technical metrics into the website audit
    const mergedAudit = {
      ...research.websiteAudit,
      ...(liveProbe && {
        hasHttps: liveProbe.hasHttps,
        isMobileResponsive: liveProbe.hasMobileViewport || research.websiteAudit.isMobileResponsive,
        pageSpeedEstimate: liveProbe.isReachable
          ? Math.max(10, Math.min(99, Math.round(100 - (liveProbe.latencyMs / 60))))
          : 0,
        liveProbe: {
          latencyMs: liveProbe.latencyMs,
          httpStatus: liveProbe.httpStatus,
          isReachable: liveProbe.isReachable,
          detectedPlatform: liveProbe.detectedPlatform,
          hasMobileViewport: liveProbe.hasMobileViewport,
        },
        metricTypes: {
          ...research.websiteAudit.metricTypes,
          hasHttps: 'MEASURED' as const,
          pageSpeedEstimate: 'MEASURED' as const,
        },
      }),
    };

    const scoreBreakdown = calculateLeadScore(
      {
        ...lead,
        websiteAudit: mergedAudit,
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
      websiteAudit: mergedAudit,
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
