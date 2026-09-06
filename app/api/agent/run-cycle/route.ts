import { NextRequest, NextResponse } from 'next/server';
import { generatePersonalizedOutreach, generateWebsiteConcept, researchBusinessDeep } from '@/lib/gemini';
import { calculateLeadScore } from '@/lib/scorer';
import { Lead, AppSettings } from '@/lib/types';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { leads = [], settings }: { leads: Lead[]; settings: AppSettings } = body;
    
    if (!settings || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Settings and leads array are required' }, { status: 400 });
    }

    if (leads.length > 100) {
      return NextResponse.json({ error: 'A maximum of 100 leads can be processed per cycle.' }, { status: 400 });
    }

    const actionsTaken: string[] = [];
    const updatedLeads: Lead[] = [];
    const modifiedLeads = new Map<string, Lead>();
    
    const getMutableLead = (lead: Lead) => {
      if (!modifiedLeads.has(lead.id)) {
        modifiedLeads.set(lead.id, { ...lead });
      }
      return modifiedLeads.get(lead.id)!;
    };

    const unresearched = leads.filter((l) => !l.websiteAudit && l.status !== 'LOST');
    for (const lead of unresearched.slice(0, 2)) {
      try {
        const research = await withUserGeminiPool(authResult.uid, () => researchBusinessDeep(lead));
        const score = calculateLeadScore(
          { ...lead, websiteAudit: research.websiteAudit, growthSignals: research.growthSignals },
          settings.scoringWeights
        );
        
        const mLead = getMutableLead(lead);
        Object.assign(mLead, {
          painPoints: research.painPoints,
          growthSignals: research.growthSignals,
          recommendedService: research.recommendedService,
          recommendedPrice: research.recommendedPrice,
          websiteAudit: research.websiteAudit,
          competitorGap: research.competitorGap,
          scoreBreakdown: score,
          status: 'QUALIFIED',
        });
        actionsTaken.push(`Audited & scored ${lead.businessName} (${score.totalScore}/100)`);
      } catch (err) {
        console.warn(`Could not audit ${lead.businessName}:`, err);
      }
    }

    const currentLeadsForOutreach = leads.map(l => modifiedLeads.get(l.id) || l);
    const needsOutreach = currentLeadsForOutreach.filter(
      (l) => (!l.generatedMessage || l.status === 'QUALIFIED') && l.status !== 'LOST'
    );
    for (const lead of needsOutreach.slice(0, 2)) {
      try {
        const outreach = await withUserGeminiPool(authResult.uid, () => generatePersonalizedOutreach(lead, settings.profile));
        const mLead = getMutableLead(lead);
        Object.assign(mLead, {
          generatedSubject: outreach.subject,
          generatedMessage: outreach.initialMessage,
          followUpSequence: outreach.followUpSequence,
          status: 'MESSAGE_READY',
        });
        actionsTaken.push(`Drafted personalized outreach sequence for ${lead.businessName}`);
      } catch (err) {
        console.warn(`Could not draft outreach for ${lead.businessName}:`, err);
      }
    }

    const currentLeadsForConcept = leads.map(l => modifiedLeads.get(l.id) || l);
    const needsConcept = currentLeadsForConcept.filter(
      (l) => !l.websiteConcept && (l.status === 'INTERESTED' || l.scoreBreakdown?.tier === 'HOT') && l.status !== 'LOST'
    );
    for (const lead of needsConcept.slice(0, 1)) {
      try {
        const concept = await withUserGeminiPool(authResult.uid, () => generateWebsiteConcept({ lead, profile: settings.profile }));
        const mLead = getMutableLead(lead);
        mLead.websiteConcept = concept;
        actionsTaken.push(`Generated concept for ${lead.businessName}`);
      } catch (err) {
        console.warn(`Could not build concept for ${lead.businessName}:`, err);
      }
    }

    if (actionsTaken.length === 0) {
      actionsTaken.push('Pipeline is fully up-to-date. All active leads have audits, messages, and next actions scheduled.');
    }

    modifiedLeads.forEach(lead => updatedLeads.push(lead));

    return NextResponse.json({ success: true, actionsTaken, updatedLeads });
  } catch (error: any) {
    console.error('Error in agent cycle:', error);
    return NextResponse.json({ error: error?.message || 'Cycle execution failed' }, { status: 500 });
  }
}
