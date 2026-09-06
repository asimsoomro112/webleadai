import { NextRequest, NextResponse } from 'next/server';
import { generateWebsiteConcept } from '@/lib/gemini';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required' }, { status: 400 });
    }

    const concept = await withUserGeminiPool(authResult.uid, () => generateWebsiteConcept({ lead, profile: settings.profile }));

    const updatedLead = { ...lead, websiteConcept: concept };

    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString(),
      type: 'CONCEPT_GENERATED',
      title: 'Interactive Web Concept Built',
      details: `Generated live preview with ${concept.colorPalette?.primary || 'modern'} theme based on ${lead.businessName} branding.`,
    };
    updatedLead.activities = [newActivity, ...(updatedLead.activities || [])];

    return NextResponse.json({ success: true, lead: updatedLead, concept });
  } catch (error: any) {
    console.error('Error generating concept:', error);
    return NextResponse.json({ error: error?.message || 'Concept generation failed' }, { status: 500 });
  }
}
