import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ previewId: string }> }
) {
  try {
    const { previewId } = await params;
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(previewId)) {
      return NextResponse.json({ error: 'Website concept not found' }, { status: 404 });
    }

    const db = getAdminFirestore();
    const result = await db
      .collectionGroup('leads')
      .where('websiteConcept.previewId', '==', previewId)
      .limit(1)
      .get();

    const lead = result.empty ? null : result.docs[0].data();

    if (!lead || !lead.websiteConcept || typeof lead.userId !== 'string') {
      return NextResponse.json({ error: 'Website concept not found' }, { status: 404 });
    }

    const settingsSnapshot = await db.doc(`users/${lead.userId}/settings/general`).get();
    const settings = settingsSnapshot.data();

    if (!settings?.profile) {
      return NextResponse.json({ error: 'Website concept owner settings are unavailable' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        businessName: lead.businessName,
        category: lead.category,
        city: lead.city,
        country: lead.country,
        phone: lead.phone,
        googleRating: lead.googleRating,
        googleReviewCount: lead.googleReviewCount,
      },
      concept: lead.websiteConcept,
      developer: {
        name: settings.profile.name,
        title: settings.profile.title,
        whatsapp: settings.profile.whatsapp,
        portfolioUrl: settings.profile.portfolioUrl,
      },
    });
  } catch (error: any) {
    console.error('Error fetching website concept:', error);
    return NextResponse.json({ error: 'Failed to fetch concept' }, { status: 500 });
  }
}
