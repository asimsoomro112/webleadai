import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import { GoogleGenAI } from '@google/genai';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { key, id } = body;

    let targetKey = key;
    let targetName = 'Provided Key';

    if (id) {
      const pool = appStore.getApiKeyPool();
      const found = pool.keys.find((k) => k.id === id);
      if (found) {
        targetKey = found.key;
        targetName = found.name;
      }
    }

    if (!targetKey || typeof targetKey !== 'string') {
      return NextResponse.json({ error: 'No API key provided for testing' }, { status: 400 });
    }

    const startTime = Date.now();
    const ai = new GoogleGenAI({
      apiKey: targetKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-test',
        },
      },
    });

    // Test with the standard fast model
    const testModel = 'gemini-3.8-flash';
    const res = await ai.models.generateContent({
      model: testModel,
      contents: 'Ping. Reply strictly with the word: PONG',
      config: {
        maxOutputTokens: 10,
        temperature: 0.1,
      },
    });

    const latencyMs = Date.now() - startTime;
    const replyText = res?.text?.trim() || '';

    if (id) {
      appStore.markKeySuccess(id);
    }

    return NextResponse.json({
      success: true,
      valid: true,
      modelUsed: testModel,
      latencyMs,
      reply: replyText,
      message: `Key "${targetName}" is active and healthy (${latencyMs}ms response).`,
    });
  } catch (err: any) {
    console.error('API key test error:', err);
    const msg = String(err?.message || err).toLowerCase();
    const isQuotaExhausted =
      err?.status === 429 ||
      err?.status === 403 ||
      msg.includes('quota') ||
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate limit');

    return NextResponse.json({
      success: false,
      valid: false,
      isQuotaExhausted,
      error: err?.message || 'Verification call failed',
    });
  }
}
