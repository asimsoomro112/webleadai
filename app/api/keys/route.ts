import { NextRequest, NextResponse } from 'next/server';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import {
  addUserApiKey,
  getSafeApiKeyPool,
  getUserApiKeyPool,
  saveUserApiKeyPool,
  setKeyStatus,
} from '@/lib/user-api-key-pool';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    return NextResponse.json({ success: true, pool: getSafeApiKeyPool(await getUserApiKeyPool(authResult.uid)) });
  } catch (error: unknown) {
    console.error('Error fetching API key pool:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch API key pool' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const { key, name, batchKeys } = await req.json();
    const rawKeys = typeof batchKeys === 'string'
      ? batchKeys.split(/[\n,;]+/).map((value: string) => value.trim()).filter((value: string) => value.length > 8)
      : typeof key === 'string' && key.trim().length > 8 ? [key.trim()] : [];

    if (!rawKeys.length) return NextResponse.json({ error: 'Please enter a valid Gemini API key.' }, { status: 400 });

    const added = [];
    for (let index = 0; index < rawKeys.length; index += 1) {
      const keyName = rawKeys.length === 1 ? name || 'Custom Gemini Key' : `Backup Key #${index + 1}`;
      added.push(await addUserApiKey(authResult.uid, keyName, rawKeys[index]));
    }
    return NextResponse.json({ success: true, message: `${added.length} API key${added.length === 1 ? '' : 's'} saved securely.`, addedCount: added.length });
  } catch (error: unknown) {
    console.error('Error adding API key:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to add API key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    const pool = await getUserApiKeyPool(authResult.uid);
    const before = pool.keys.length;
    pool.keys = pool.keys.filter((key) => key.id !== id);
    if (pool.keys.length === before) return NextResponse.json({ error: 'API key was not found.' }, { status: 404 });
    await saveUserApiKeyPool(authResult.uid, pool);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to remove API key' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireApiUser(req);
    if (isApiError(authResult)) return authResult;
    const { action, id, autoRotateOnQuota } = await req.json();
    const pool = await getUserApiKeyPool(authResult.uid);

    if (action === 'reset_all_quota') {
      pool.keys.forEach((key) => {
        if (key.status === 'QUOTA_EXHAUSTED' || key.status === 'RATE_LIMITED') {
          key.status = 'ACTIVE';
          key.lastError = undefined;
        }
      });
    } else if (action === 'reset_quota' && id) {
      if (!setKeyStatus(pool, id, 'ACTIVE')) return NextResponse.json({ error: 'API key was not found.' }, { status: 404 });
    } else if (action === 'toggle' && id) {
      if (!setKeyStatus(pool, id)) return NextResponse.json({ error: 'API key was not found.' }, { status: 404 });
    } else if (typeof autoRotateOnQuota === 'boolean') {
      pool.autoRotateOnQuota = autoRotateOnQuota;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await saveUserApiKeyPool(authResult.uid, pool);
    return NextResponse.json({ success: true, pool: getSafeApiKeyPool(pool) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update API key pool' }, { status: 500 });
  }
}
