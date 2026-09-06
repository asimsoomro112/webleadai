import { NextRequest, NextResponse } from 'next/server';
import { discoverRealBusinesses, researchBusinessDeep, generatePersonalizedOutreach } from '@/lib/gemini';
import { calculateLeadScore } from '@/lib/scorer';
import { Lead } from '@/lib/types';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';
import { normalizeLead } from '@/lib/lead-utils';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const {
      settings,
      category = 'Restaurants',
      city = 'Karachi',
      country = 'Pakistan',
      keywords = '',
      websiteStatusPreference = 'NO_WEBSITE',
      minCount = 5,
      autoResearch = true,
      autoGenerateMessage = true,
    } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings required' }, { status: 400 });
    }

    if (!Number.isInteger(minCount) || minCount < 1 || minCount > 10) {
      return NextResponse.json({ error: 'minCount must be an integer between 1 and 10.' }, { status: 400 });
    }

    return withUserGeminiPool(authResult.uid, async () => {
      const rawBusinesses = await discoverRealBusinesses({
        category,
        city,
        country,
        keywords,
        websiteStatusPreference,
        minCount,
      });

    const addedLeads: Lead[] = [];

    for (const b of rawBusinesses) {
      let leadPayload = normalizeLead({
        ...b,
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        businessName: b.businessName || "Unknown",
        category: b.category || category,
        city: b.city || city,
        country: b.country || country,
        websiteUrl: b.websiteUrl || "",
        websiteStatus: b.websiteStatus || (b.websiteUrl ? 'OUTDATED_WEBSITE' : 'NO_WEBSITE'),
        phone: b.phone,
        status: 'NEW',
        activities: [],
      });

      if (autoResearch) {
        try {
          const research = await researchBusinessDeep(leadPayload as unknown as Lead);
          const scoreBreakdown = calculateLeadScore(
            { ...leadPayload, websiteAudit: research.websiteAudit, growthSignals: research.growthSignals },
            settings.scoringWeights
          );
          
          Object.assign(leadPayload, {
            painPoints: research.painPoints || leadPayload.painPoints,
            growthSignals: research.growthSignals || leadPayload.growthSignals,
            recommendedService: research.recommendedService || leadPayload.recommendedService,
            recommendedPrice: research.recommendedPrice || leadPayload.recommendedPrice,
            websiteAudit: research.websiteAudit,
            competitorGap: research.competitorGap,
            scoreBreakdown,
            dealValue: research.recommendedPrice || leadPayload.dealValue,
            status: 'QUALIFIED',
          });

          leadPayload.activities.push({
            id: `act_${Date.now()}_r`,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString(),
            type: 'RESEARCHED',
            title: 'Auto-Researched during Discovery',
            details: `Found ${research.painPoints?.length || 0} pain points.`,
          });
        } catch (err) {
          console.error(`Research failed for ${b.businessName}`, err);
        }
      }

      if (autoGenerateMessage && leadPayload.status === 'QUALIFIED') {
        try {
          const outreach = await generatePersonalizedOutreach(leadPayload as unknown as Lead, settings.profile);
          Object.assign(leadPayload, {
            generatedSubject: outreach.subject,
            generatedMessage: outreach.initialMessage,
            followUpSequence: outreach.followUpSequence,
            status: 'MESSAGE_READY',
          });

          leadPayload.activities.push({
            id: `act_${Date.now()}_m`,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString(),
            type: 'MESSAGE_GENERATED',
            title: 'Auto-Generated Outreach during Discovery',
            details: `Subject: ${outreach.subject}`,
          });
        } catch (err) {
          console.error(`Message generation failed for ${b.businessName}`, err);
        }
      }

      addedLeads.push(normalizeLead(leadPayload));
    }

      return NextResponse.json({ success: true, leads: addedLeads });
    });
  } catch (error: any) {
    console.error('Discovery process failed:', error);
    return NextResponse.json({ error: error?.message || 'Discovery failed' }, { status: 500 });
  }
}
