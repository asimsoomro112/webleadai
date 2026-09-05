import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import { PipelineStatus } from '@/lib/types';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const status = searchParams.get('status') as PipelineStatus | null;
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : 0;
    const tier = searchParams.get('tier');
    const query = searchParams.get('q')?.toLowerCase();

    let leads = appStore.getLeads();

    if (category && category !== 'ALL') {
      leads = leads.filter((l) => l.category.toLowerCase() === category.toLowerCase());
    }

    if (city && city !== 'ALL') {
      leads = leads.filter((l) => l.city.toLowerCase() === city.toLowerCase());
    }

    if (status) {
      leads = leads.filter((l) => l.status === status);
    }

    if (minScore > 0) {
      leads = leads.filter((l) => l.scoreBreakdown.totalScore >= minScore);
    }

    if (tier && tier !== 'ALL') {
      leads = leads.filter((l) => l.scoreBreakdown.tier === tier);
    }

    if (query) {
      leads = leads.filter(
        (l) =>
          l.businessName.toLowerCase().includes(query) ||
          l.city.toLowerCase().includes(query) ||
          l.category.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ leads, total: leads.length });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    if (!body.businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    const newLead = appStore.addLead(body);
    return NextResponse.json({ lead: newLead, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
