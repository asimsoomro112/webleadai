import { NextRequest, NextResponse } from 'next/server';
import { appStore } from '@/lib/store';
import { GoogleGenAI } from '@google/genai';
import { isApiError, requireApiUser } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const pool = appStore.getApiKeyPool();
    // Return safe masked view
    const safeKeys = pool.keys.map((k) => ({
      id: k.id,
      name: k.name,
      maskedKey: k.maskedKey,
      status: k.status,
      addedAt: k.addedAt,
      lastUsedAt: k.lastUsedAt,
      lastError: k.lastError,
      successCount: k.successCount,
      failureCount: k.failureCount,
      isSystemDefault: k.isSystemDefault || false,
    }));

    const activeCount = safeKeys.filter((k) => k.status === 'ACTIVE').length;
    const exhaustedCount = safeKeys.filter((k) => k.status === 'QUOTA_EXHAUSTED' || k.status === 'RATE_LIMITED').length;

    return NextResponse.json({
      success: true,
      pool: {
        autoRotateOnQuota: pool.autoRotateOnQuota,
        activeKeyId: pool.activeKeyId,
        lastRotationEvent: pool.lastRotationEvent,
        totalKeys: safeKeys.length,
        activeCount,
        exhaustedCount,
        keys: safeKeys,
      },
    });
  } catch (error: any) {
    console.error('Error fetching API key pool:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch API key pool' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { key, name, batchKeys } = body;

    // Handle batch key input (comma or newline separated)
    if (batchKeys && typeof batchKeys === 'string') {
      const rawList = batchKeys
        .split(/[\n,;]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 8);

      const added = [];
      for (let i = 0; i < rawList.length; i++) {
        const k = rawList[i];
        const addedKey = appStore.addApiKey(`Backup Key #${i + 1}`, k);
        added.push(addedKey);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${added.length} API keys into pool.`,
        addedCount: added.length,
      });
    }

    if (!key || typeof key !== 'string' || key.trim().length < 8) {
      return NextResponse.json({ error: 'Please enter a valid Gemini API key.' }, { status: 400 });
    }

    const newKey = appStore.addApiKey(name || 'Custom Gemini Key', key.trim());

    return NextResponse.json({
      success: true,
      message: `Key "${newKey.name}" added to rotation pool.`,
      key: {
        id: newKey.id,
        name: newKey.name,
        maskedKey: newKey.maskedKey,
        status: newKey.status,
      },
    });
  } catch (error: any) {
    console.error('Error adding API key:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add API key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    const removed = appStore.removeApiKey(id);
    return NextResponse.json({ success: removed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to remove API key' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const body = await req.json();
    const { action, id, autoRotateOnQuota } = body;

    if (action === 'reset_all_quota') {
      appStore.resetAllKeysQuota();
      return NextResponse.json({ success: true, message: 'All keys reset to active.' });
    }

    if (action === 'reset_quota' && id) {
      const updated = appStore.resetKeyQuota(id);
      return NextResponse.json({ success: true, key: updated });
    }

    if (action === 'toggle' && id) {
      const updated = appStore.toggleApiKeyStatus(id);
      return NextResponse.json({ success: true, key: updated });
    }

    if (typeof autoRotateOnQuota === 'boolean') {
      const pool = appStore.getApiKeyPool();
      pool.autoRotateOnQuota = autoRotateOnQuota;
      return NextResponse.json({ success: true, autoRotateOnQuota });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update key pool' }, { status: 500 });
  }
}
