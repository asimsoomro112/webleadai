import { getAdminFirestore } from './api-auth';
import { ApiKeyPoolSettings, ApiKeyStatus, GeminiKeyConfig } from './types';

const COLLECTION = 'privateApiKeyPools';

function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

function emptyPool(): ApiKeyPoolSettings {
  return { keys: [], autoRotateOnQuota: true };
}

function normalizeKey(value: unknown): GeminiKeyConfig | null {
  if (!value || typeof value !== 'object') return null;
  const key = value as Partial<GeminiKeyConfig>;
  if (!key.id || !key.key || !key.name) return null;

  return {
    id: key.id,
    name: key.name,
    key: key.key,
    maskedKey: maskApiKey(key.key),
    status: key.status ?? 'ACTIVE',
    addedAt: key.addedAt ?? new Date().toISOString(),
    lastUsedAt: key.lastUsedAt,
    lastError: key.lastError,
    successCount: key.successCount ?? 0,
    failureCount: key.failureCount ?? 0,
    isSystemDefault: false,
  };
}

function normalizePool(value: unknown): ApiKeyPoolSettings {
  if (!value || typeof value !== 'object') return emptyPool();
  const pool = value as Partial<ApiKeyPoolSettings>;
  return {
    keys: Array.isArray(pool.keys)
      ? pool.keys.map(normalizeKey).filter((key): key is GeminiKeyConfig => key !== null)
      : [],
    autoRotateOnQuota: pool.autoRotateOnQuota !== false,
    activeKeyId: pool.activeKeyId,
    lastRotationEvent: pool.lastRotationEvent,
  };
}

function poolRef(uid: string) {
  return getAdminFirestore().collection(COLLECTION).doc(uid);
}

export async function getUserApiKeyPool(uid: string): Promise<ApiKeyPoolSettings> {
  const snapshot = await poolRef(uid).get();
  return normalizePool(snapshot.data());
}

export async function saveUserApiKeyPool(uid: string, pool: ApiKeyPoolSettings): Promise<ApiKeyPoolSettings> {
  const normalized = normalizePool(pool);
  await poolRef(uid).set({ ...normalized, updatedAt: new Date().toISOString() });
  return normalized;
}

export async function addUserApiKey(uid: string, name: string, rawKey: string): Promise<GeminiKeyConfig> {
  const pool = await getUserApiKeyPool(uid);
  const key = rawKey.trim();
  if (!key) throw new Error('API key cannot be empty.');

  const existing = pool.keys.find((item) => item.key === key);
  if (existing) {
    existing.status = 'ACTIVE';
    existing.lastError = undefined;
    await saveUserApiKeyPool(uid, pool);
    return existing;
  }

  const newKey: GeminiKeyConfig = {
    id: `key_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim() || `API Key #${pool.keys.length + 1}`,
    key,
    maskedKey: maskApiKey(key),
    status: 'ACTIVE',
    addedAt: new Date().toISOString(),
    successCount: 0,
    failureCount: 0,
    isSystemDefault: false,
  };
  pool.keys.push(newKey);
  await saveUserApiKeyPool(uid, pool);
  return newKey;
}

export function getSafeApiKeyPool(pool: ApiKeyPoolSettings) {
  const keys = pool.keys.map(({ key: _key, ...safeKey }) => safeKey);
  return {
    autoRotateOnQuota: pool.autoRotateOnQuota,
    activeKeyId: pool.activeKeyId,
    lastRotationEvent: pool.lastRotationEvent,
    totalKeys: keys.length,
    activeCount: keys.filter((key) => key.status === 'ACTIVE').length,
    exhaustedCount: keys.filter((key) => key.status === 'QUOTA_EXHAUSTED' || key.status === 'RATE_LIMITED').length,
    keys,
  };
}

export function setKeyStatus(pool: ApiKeyPoolSettings, id: string, status?: ApiKeyStatus): GeminiKeyConfig | null {
  const key = pool.keys.find((item) => item.id === id);
  if (!key) return null;
  key.status = status ?? (key.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED');
  if (key.status === 'ACTIVE') key.lastError = undefined;
  return key;
}
