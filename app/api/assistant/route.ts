import { NextRequest, NextResponse } from 'next/server';
import { generateSalesCopilotAdvice } from '@/lib/gemini';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { withUserGeminiPool } from '@/lib/user-gemini-context';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { lead, settings, query } = body;

    if (!lead || !settings) {
      return NextResponse.json({ error: 'Lead and Settings are required' }, { status: 400 });
    }

    const answer = await withUserGeminiPool(authResult.uid, () => generateSalesCopilotAdvice(lead, settings.profile, query));

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error('Error generating assistant advice:', error);
    return NextResponse.json({ error: error?.message || 'Assistant failed' }, { status: 500 });
  }
}
