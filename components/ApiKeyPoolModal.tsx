'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  X,
  Power,
  Layers,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ApiKeyStatus } from '@/lib/types';
import { apiFetch } from '@/lib/api-client';

interface SafeKeyItem {
  id: string;
  name: string;
  maskedKey: string;
  status: ApiKeyStatus;
  addedAt: string;
  lastUsedAt?: string;
  lastError?: string;
  successCount: number;
  failureCount: number;
  isSystemDefault?: boolean;
}

interface ApiKeyPoolData {
  autoRotateOnQuota: boolean;
  activeKeyId?: string;
  lastRotationEvent?: {
    fromKeyName: string;
    toKeyName: string;
    reason: string;
    timestamp: string;
  };
  totalKeys: number;
  activeCount: number;
  exhaustedCount: number;
  keys: SafeKeyItem[];
}

interface ApiKeyPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export function ApiKeyPoolModal({ isOpen, onClose, onKeysUpdated }: ApiKeyPoolModalProps) {
  const [poolData, setPoolData] = useState<ApiKeyPoolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Key Form state
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [batchKeysText, setBatchKeysText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Testing Key state
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/keys');
      if (!res.ok) throw new Error('Failed to fetch keys');
      const data = await res.json();
      if (data.pool) {
        setPoolData(data.pool);
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;

    apiFetch('/api/keys')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data?.pool) {
          setPoolData(data.pool);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err?.message || 'Error loading API keys');
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const handleAddSingleKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await apiFetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim() || undefined,
          key: newKeyValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add key');

      setSuccessMsg(data.message || 'Key added to rotation pool!');
      setNewKeyName('');
      setNewKeyValue('');
      fetchKeys();
      onKeysUpdated?.();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to add key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBatchKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchKeysText.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await apiFetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchKeys: batchKeysText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import batch keys');

      setSuccessMsg(data.message || 'Batch keys imported successfully!');
      setBatchKeysText('');
      fetchKeys();
      onKeysUpdated?.();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to import batch keys');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from rotation?`)) return;

    try {
      const res = await apiFetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete key');
      fetchKeys();
      onKeysUpdated?.();
      setSuccessMsg(`Key "${name}" removed.`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete key');
    }
  };

  const handleToggleKey = async (id: string) => {
    try {
      const res = await apiFetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });
      if (!res.ok) throw new Error('Failed to toggle key status');
      fetchKeys();
      onKeysUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle status');
    }
  };

  const handleResetQuota = async (id: string) => {
    try {
      const res = await apiFetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_quota', id }),
      });
      if (!res.ok) throw new Error('Failed to reset quota');
      fetchKeys();
      onKeysUpdated?.();
      setSuccessMsg('Key quota status reset to active.');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset quota');
    }
  };

  const handleResetAllQuotas = async () => {
    try {
      const res = await apiFetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all_quota' }),
      });
      if (!res.ok) throw new Error('Failed to reset all quotas');
      fetchKeys();
      onKeysUpdated?.();
      setSuccessMsg('All keys have been reset to active state!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset all quotas');
    }
  };

  const handleToggleAutoRotate = async () => {
    if (!poolData) return;
    try {
      const nextVal = !poolData.autoRotateOnQuota;
      const res = await apiFetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRotateOnQuota: nextVal }),
      });
      if (!res.ok) throw new Error('Failed to update rotation setting');
      setPoolData({ ...poolData, autoRotateOnQuota: nextVal });
      onKeysUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to update auto-rotate');
    }
  };

  const handleTestKey = async (id: string) => {
    try {
      setTestingKeyId(id);
      setTestResult(null);
      const res = await apiFetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setTestResult({
        id,
        success: data.valid,
        message: data.valid
          ? `Verified! Latency: ${data.latencyMs}ms (${data.modelUsed})`
          : data.error || 'Verification failed',
      });
      fetchKeys();
      onKeysUpdated?.();
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        message: err?.message || 'Network error during key verification',
      });
    } finally {
      setTestingKeyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="api-key-pool-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="api-key-pool-modal-container"
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Gemini API Key Pool & Quota Auto-Rotation
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  High Availability
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Automatically rotates to the next API key whenever a key hits rate limits or quota exhaustion.
              </p>
            </div>
          </div>
          <button
            id="close-api-key-modal-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts & Banners */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
              &times;
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* Rotation Event Notification Banner */}
        {poolData?.lastRotationEvent && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Recent Auto-Failover:</strong> Rotated from{' '}
                <span className="font-semibold underline">{poolData.lastRotationEvent.fromKeyName}</span> to{' '}
                <span className="font-semibold underline">{poolData.lastRotationEvent.toKeyName}</span> due to quota limit.
              </span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">
              {new Date(poolData.lastRotationEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metrics & Auto-Rotation Toggle */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Total Keys</span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {poolData?.totalKeys ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready / Active
              </span>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {poolData?.activeCount ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Quota Exhausted
              </span>
              <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                {poolData?.exhaustedCount ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Auto-Rotate</span>
                <button
                  onClick={handleToggleAutoRotate}
                  className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    poolData?.autoRotateOnQuota ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                  }`}
                  title="Toggle automatic quota rotation"
                >
                  <div className="bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition" />
                </button>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1">
                {poolData?.autoRotateOnQuota ? 'Active: Next key on 429' : 'Manual key selection'}
              </span>
            </div>
          </div>

          {/* Key Pool List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-500" />
                Saved API Keys in Rotation
              </h3>
              <div className="flex items-center gap-2">
                {poolData && poolData.exhaustedCount > 0 && (
                  <button
                    id="reset-all-quotas-btn"
                    onClick={handleResetAllQuotas}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/70 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Quotas</span>
                  </button>
                )}
                <button
                  id="refresh-key-pool-btn"
                  onClick={fetchKeys}
                  disabled={loading}
                  className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Refresh pool"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loading && !poolData ? (
              <div className="py-8 text-center text-xs text-zinc-500">Loading API key pool...</div>
            ) : poolData?.keys.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                <Key className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  No custom API keys added yet.
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                  Add 2 or more Gemini API keys below so the autonomous agent can continuously discover leads, generate concepts, and draft outreach without hitting quota stops.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {poolData?.keys.map((keyItem, index) => {
                  const isTesting = testingKeyId === keyItem.id;
                  const isCurrentTest = testResult?.id === keyItem.id;

                  return (
                    <div
                      key={keyItem.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        keyItem.status === 'ACTIVE'
                          ? 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800'
                          : keyItem.status === 'QUOTA_EXHAUSTED' || keyItem.status === 'RATE_LIMITED'
                          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/70'
                          : 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/50 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                              keyItem.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : keyItem.status === 'QUOTA_EXHAUSTED' || keyItem.status === 'RATE_LIMITED'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            #{index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {keyItem.name}
                              </span>
                              {keyItem.isSystemDefault && (
                                <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  Default
                                </span>
                              )}
                              {/* Status badge */}
                              {keyItem.status === 'ACTIVE' ? (
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active
                                </span>
                              ) : keyItem.status === 'QUOTA_EXHAUSTED' ? (
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Quota Reached (429)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                                  {keyItem.status}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                              <span>{keyItem.maskedKey}</span>
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {keyItem.successCount} reqs OK
                              </span>
                              {keyItem.failureCount > 0 && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                  <span className="text-amber-600 dark:text-amber-400">
                                    {keyItem.failureCount} quota/fails
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Error reason if exhausted */}
                            {keyItem.lastError && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 max-w-md line-clamp-1">
                                Reason: {keyItem.lastError}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {/* Test live button */}
                          <button
                            onClick={() => handleTestKey(keyItem.id)}
                            disabled={isTesting}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Verify key with a quick test prompt"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : 'text-emerald-500'}`} />
                            <span>{isTesting ? 'Testing...' : 'Test Live'}</span>
                          </button>

                          {/* Reset quota button */}
                          {(keyItem.status === 'QUOTA_EXHAUSTED' || keyItem.status === 'RATE_LIMITED') && (
                            <button
                              onClick={() => handleResetQuota(keyItem.id)}
                              className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                              title="Reset quota status back to Active"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Toggle active / disabled */}
                          <button
                            onClick={() => handleToggleKey(keyItem.id)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title={keyItem.status === 'DISABLED' ? 'Enable key' : 'Disable key'}
                          >
                            <Power className={`w-3.5 h-3.5 ${keyItem.status !== 'DISABLED' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                          </button>

                          {/* Delete key */}
                          {!keyItem.isSystemDefault && (
                            <button
                              onClick={() => handleDeleteKey(keyItem.id, keyItem.name)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Remove key from pool"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Test feedback */}
                      {isCurrentTest && testResult && (
                        <div
                          className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                            testResult.success
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                          }`}
                        >
                          {testResult.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="flex-1">{testResult.message}</span>
                          <button onClick={() => setTestResult(null)} className="opacity-60 hover:opacity-100">
                            &times;
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Key Section */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                Add Gemini API Keys to Pool
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('single')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    activeTab === 'single'
                      ? 'bg-emerald-500 text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  Single Key
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('batch')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    activeTab === 'batch'
                      ? 'bg-emerald-500 text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  Batch Import (Multi)
                </button>
              </div>
            </div>

            {activeTab === 'single' ? (
              <form onSubmit={handleAddSingleKey} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Key Label / Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Project 2 / Backup Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Gemini API Key (AIzaSy...)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Paste Gemini API Key"
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        required
                        className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !newKeyValue.trim()}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'Saving...' : 'Add Key'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddBatchKeys} className="space-y-2.5">
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Paste Multiple Gemini API Keys (one per line or separated by commas)
                </label>
                <textarea
                  rows={3}
                  placeholder={`AIzaSyExampleKey1...\nAIzaSyExampleKey2...\nAIzaSyExampleKey3...`}
                  value={batchKeysText}
                  onChange={(e) => setBatchKeysText(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !batchKeysText.trim()}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Importing...' : 'Import All Keys'}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                Keys are stored securely in your app container. Quota limits on one key will automatically trigger instantaneous switchover to your subsequent keys.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs">
          <div className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready for autonomous continuous discovery & closing</span>
          </div>
          <button
            id="close-api-key-modal-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
