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
  const pool = await getUserApiKeyPool(uid);
  if (pool.keys.length === 0) {
    throw new Error('No Gemini API key is saved. Add a key in the API Key Pool before continuing.');
  }

  const context: UserGeminiContext = { pool, hasChanges: false };
  return userGeminiContext.run(context, async () => {
    try {
      return await operation();
    } finally {
      if (context.hasChanges) {
        await saveUserApiKeyPool(uid, context.pool);
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
