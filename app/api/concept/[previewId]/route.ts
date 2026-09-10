import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/api-auth';
import { DEFAULT_PROFILE, SEED_LEADS, appStore } from '@/lib/store';
import { generateWebsiteConcept } from '@/lib/gemini';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ previewId: string }> }
) {
  try {
    const { previewId } = await params;
    if (!previewId || !/^[a-zA-Z0-9_.-]{1,128}$/.test(previewId)) {
      return NextResponse.json({ error: 'Invalid preview ID' }, { status: 400 });
    }

    // 1. Check in-memory store and SEED_LEADS first (e.g. apex-spine, kolachi-coast, vanguard-fitness)
    const seedLead =
      SEED_LEADS.find(
        (l) => l.websiteConcept?.previewId === previewId || l.id === previewId
      ) ||
      appStore.getLeadByConceptPreviewId(previewId) ||
      appStore.getLeadById(previewId);

    if (seedLead && seedLead.websiteConcept) {
      return NextResponse.json({
        success: true,
        lead: {
          id: seedLead.id,
          businessName: seedLead.businessName,
          category: seedLead.category,
          city: seedLead.city,
          country: seedLead.country,
          phone: seedLead.phone,
          googleRating: seedLead.googleRating,
          googleReviewCount: seedLead.googleReviewCount,
        },
        concept: seedLead.websiteConcept,
        developer: {
          name: DEFAULT_PROFILE.name,
          title: DEFAULT_PROFILE.title,
          whatsapp: DEFAULT_PROFILE.whatsapp,
          portfolioUrl: DEFAULT_PROFILE.portfolioUrl,
        },
      });
    }

    // 2. Query Firestore collectionGroup for user-generated or custom concepts
    try {
      const db = getAdminFirestore();
      if (db) {
        let docSnap = null;
        let leadData: any = null;

        // Try collectionGroup by websiteConcept.previewId
        try {
          const result = await db
            .collectionGroup('leads')
            .where('websiteConcept.previewId', '==', previewId)
            .limit(1)
            .get();

          if (!result.empty) {
            docSnap = result.docs[0];
            leadData = docSnap.data();
          }
        } catch (cgErr) {
          console.warn('CollectionGroup query by websiteConcept.previewId failed:', cgErr);
        }

        // If not found, also try querying by lead id
        if (!leadData) {
          try {
            const idResult = await db
              .collectionGroup('leads')
              .where('id', '==', previewId)
              .limit(1)
              .get();

            if (!idResult.empty) {
              docSnap = idResult.docs[0];
              leadData = docSnap.data();
            }
          } catch (idErr) {
            console.warn('CollectionGroup query by id failed:', idErr);
          }
        }

        if (leadData && leadData.websiteConcept) {
          let developer = {
            name: DEFAULT_PROFILE.name,
            title: DEFAULT_PROFILE.title,
            whatsapp: DEFAULT_PROFILE.whatsapp,
            portfolioUrl: DEFAULT_PROFILE.portfolioUrl,
          };

          if (leadData.userId) {
            try {
              const settingsSnapshot = await db.doc(`users/${leadData.userId}/settings/general`).get();
              const settings = settingsSnapshot.data();
              if (settings?.profile) {
                developer = {
                  name: settings.profile.name || DEFAULT_PROFILE.name,
                  title: settings.profile.title || DEFAULT_PROFILE.title,
                  whatsapp: settings.profile.whatsapp || settings.profile.phone || DEFAULT_PROFILE.whatsapp,
                  portfolioUrl: settings.profile.portfolioUrl || DEFAULT_PROFILE.portfolioUrl,
                };
              }
            } catch {
              // keep fallback
            }
          }

          return NextResponse.json({
            success: true,
            lead: {
              id: leadData.id,
              businessName: leadData.businessName,
              category: leadData.category,
              city: leadData.city,
              country: leadData.country,
              phone: leadData.phone,
              googleRating: leadData.googleRating,
              googleReviewCount: leadData.googleReviewCount,
            },
            concept: leadData.websiteConcept,
            developer,
          });
        }
      }
    } catch (adminErr) {
      console.warn('Firestore admin concept lookup error:', adminErr);
    }

    // 3. Fallback: If lead is in appStore or SEED_LEADS without concept, generate on-the-fly
    if (seedLead) {
      const generated = await generateWebsiteConcept({ lead: seedLead, profile: DEFAULT_PROFILE });
      seedLead.websiteConcept = generated;
      appStore.setWebsiteConcept(seedLead.id, generated);

      return NextResponse.json({
        success: true,
        lead: {
          id: seedLead.id,
          businessName: seedLead.businessName,
          category: seedLead.category,
          city: seedLead.city,
          country: seedLead.country,
          phone: seedLead.phone,
          googleRating: seedLead.googleRating,
          googleReviewCount: seedLead.googleReviewCount,
        },
        concept: generated,
        developer: {
          name: DEFAULT_PROFILE.name,
          title: DEFAULT_PROFILE.title,
          whatsapp: DEFAULT_PROFILE.whatsapp,
          portfolioUrl: DEFAULT_PROFILE.portfolioUrl,
        },
      });
    }

    // 4. Infallible fallback: If someone visits /preview/[previewId] directly, generate a high-converting prototype
    const cleanName = previewId
      .replace(/^concept_/, '')
      .replace(/^lead_/, '')
      .replace(/_[a-z0-9]+$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();

    const fallbackLead: any = {
      id: previewId,
      businessName: cleanName.length > 2
        ? cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Featured Local Business',
      category: 'Professional Services',
      city: 'Karachi',
      country: 'Pakistan',
      phone: DEFAULT_PROFILE.phone,
      googleRating: 4.9,
      googleReviewCount: 42,
    };

    const fallbackConcept = await generateWebsiteConcept({ lead: fallbackLead, profile: DEFAULT_PROFILE });
    fallbackConcept.previewId = previewId;

    return NextResponse.json({
      success: true,
      lead: fallbackLead,
      concept: fallbackConcept,
      developer: {
        name: DEFAULT_PROFILE.name,
        title: DEFAULT_PROFILE.title,
        whatsapp: DEFAULT_PROFILE.whatsapp,
        portfolioUrl: DEFAULT_PROFILE.portfolioUrl,
      },
    });
  } catch (error: any) {
    console.error('Error fetching website concept:', error);
    return NextResponse.json({ error: 'Failed to fetch concept' }, { status: 500 });
  }
}
