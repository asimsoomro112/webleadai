import { AsyncLocalStorage } from 'node:async_hooks';
import { ApiKeyPoolSettings } from './types';
import { getUserApiKeyPool, saveUserApiKeyPool } from './user-api-key-pool';

interface UserGeminiContext {
  pool: ApiKeyPoolSettings;
  hasChanges: boolean;
}

const userGeminiContext = new AsyncLocalStorage<UserGeminiContext>();

/**
 * Makes a user's saved API-key pool available to Gemini calls for the duration
 * of one authenticated request. The pool is intentionally request-scoped so a
 * key can never be shared with another signed-in user.
 */
export async function withUserGeminiPool<T>(uid: string, operation: () => Promise<T>): Promise<T> {
  let pool: ApiKeyPoolSettings;
  try {
    pool = await getUserApiKeyPool(uid);
  } catch {
    pool = { keys: [], autoRotateOnQuota: true };
  }

  // If user has no custom keys saved in Firestore, fallback to system env keys
  if (!pool.keys || pool.keys.length === 0) {
    const envKey = process.env.GEMINI_API_KEY;
    const envKeysList = process.env.GEMINI_API_KEYS;
    const fallbackKeys = [];

    if (envKey) {
      fallbackKeys.push({
        id: 'sys_env_gemini_key',
        name: 'System Default Key',
        key: envKey,
        maskedKey: '••••••••',
        status: 'ACTIVE' as const,
        addedAt: new Date().toISOString(),
        successCount: 0,
        failureCount: 0,
        isSystemDefault: true,
      });
    }

    if (envKeysList) {
      envKeysList.split(',').forEach((k, i) => {
        const clean = k.trim();
        if (clean && clean !== envKey) {
          fallbackKeys.push({
            id: `env_key_${i}`,
            name: `Environment Key #${i + 1}`,
            key: clean,
            maskedKey: '••••••••',
            status: 'ACTIVE' as const,
            addedAt: new Date().toISOString(),
            successCount: 0,
            failureCount: 0,
            isSystemDefault: true,
          });
        }
      });
    }

    pool = { keys: fallbackKeys, autoRotateOnQuota: true };
  }

  const context: UserGeminiContext = { pool, hasChanges: false };
  return userGeminiContext.run(context, async () => {
    try {
      return await operation();
    } finally {
      if (context.hasChanges && pool.keys.some((k) => !k.isSystemDefault)) {
        try {
          await saveUserApiKeyPool(uid, context.pool);
        } catch (e) {
          console.warn('Could not persist key pool update:', e);
        }
      }
    }
  });
}

export function getRequestGeminiPool(): ApiKeyPoolSettings | undefined {
  return userGeminiContext.getStore()?.pool;
}

export function recordRequestGeminiKeySuccess(id: string): boolean {
  const context = userGeminiContext.getStore();
  const key = context?.pool.keys.find((item) => item.id === id);
  if (!context || !key) return false;

  key.status = 'ACTIVE';
  key.successCount += 1;
  key.lastUsedAt = new Date().toISOString();
  delete key.lastError;
  context.hasChanges = true;
  return true;
}

export function recordRequestGeminiKeyQuotaError(id: string, errorMessage: string): boolean {
  const context = userGeminiContext.getStore();
  const key = context?.pool.keys.find((item) => item.id === id);
  if (!context || !key) return false;

  key.status = 'QUOTA_EXHAUSTED';
  key.lastError = errorMessage;
  key.failureCount += 1;
  key.lastUsedAt = new Date().toISOString();

  const nextKey = context.pool.keys.find((item) => item.status === 'ACTIVE' && item.id !== id);
  if (nextKey) {
    context.pool.lastRotationEvent = {
      fromKeyName: key.name,
      toKeyName: nextKey.name,
      reason: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  context.hasChanges = true;
  return true;
}
