'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  DollarSign,
  Sliders,
  CheckCircle2,
  Save,
  Globe,
  Phone,
  Mail,
  ShieldCheck,
  Key,
  Zap,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { AppSettings } from '@/lib/types';
import { useAuth } from '@/lib/authContext';

interface SettingsViewProps {
  settings: AppSettings | null;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onOpenKeyPool?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

export function SettingsView({ settings, onSaveSettings, onOpenKeyPool, onOpenAuth }: SettingsViewProps) {
  const { user, userProfile, signOutUser, updateProfileInfo } = useAuth();
  const [profile, setProfile] = useState(
    settings?.profile || {
      name: 'Freelance Web Developer',
      title: 'Full-Stack Web Developer & Conversion Specialist',
      portfolioUrl: 'https://github.com/developer',
      phone: '+923001234567',
      whatsapp: '+923001234567',
      email: 'dev@weblead.agency',
      location: 'Karachi, Pakistan',
      experienceYears: 4,
      services: ['Landing Pages', 'E-commerce & WhatsApp Stores', 'Mobile Optimization'],
      techStack: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript', 'Node.js'],
      specialOffer: 'Compliant mobile-first overhaul with 7-day turnaround and direct WhatsApp booking integration',
    }
  );

  const [scoringWeights, setScoringWeights] = useState(
    settings?.scoringWeights || {
      noWebsite: 40,
      outdatedWebsite: 25,
      poorMobile: 20,
      activeSocialPresence: 15,
      growingBusiness: 10,
      weakConversionFunnel: 15,
      strongLocalDemand: 10,
    }
  );

  const [dailyLimit, setDailyLimit] = useState(settings?.dailyOutreachLimit || 15);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [prevSettingsProfile, setPrevSettingsProfile] = useState(settings?.profile);
  if (settings?.profile && settings.profile !== prevSettingsProfile) {
    setPrevSettingsProfile(settings.profile);
    setProfile(settings.profile);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (user && profile.name) {
        await updateProfileInfo({
          displayName: profile.name,
          phone: profile.phone,
          website: profile.portfolioUrl,
          bio: profile.title,
        });
      }
      await onSaveSettings({
        profile,
        scoringWeights,
        dailyOutreachLimit: dailyLimit,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Settings & Acquisition Profile
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Configure your developer credentials, automated proposal pricing, and AI qualification weights.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Saved to Firestore!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
            </>
          )}
        </button>
      </div>

      {/* Account & Multi-User Cloud Status Card */}
      <div
        id="account-cloud-status-card"
        className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">
            {user ? (userProfile?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U') : <User className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {user ? (userProfile?.displayName || user.email) : 'Guest / Local Session'}
              </h3>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                user
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}>
                {user ? 'Firestore Multi-User Sync' : 'Local Preview'}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
              {user ? (
                <>
                  Signed in as <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user.email}</span>. Your target industries, developer profile, pricing tiers, client leads, and custom API key pool are isolated and backed up to Firebase Firestore.
                </>
              ) : (
                'Sign in or create your free account to persist your client acquisition pipeline, custom pitch settings, and private Gemini API keys permanently in Firebase Firestore.'
              )}
            </p>
          </div>
        </div>

        <div>
          {user ? (
            <button
              type="button"
              onClick={() => signOutUser()}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth?.('signin')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Create Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Gemini API Key Pool & Quota Failover Card */}
      <div
        id="api-key-pool-settings-card"
        className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-zinc-100 to-zinc-50 dark:from-emerald-950/20 dark:via-zinc-900/60 dark:to-zinc-900/40 border border-emerald-500/20 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Gemini API Key Pool & Quota Auto-Rotation
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Continuous Discovery
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
              Save multiple API keys in your rotation pool. When any key hits rate limits or quota exhaustion (HTTP 429), the system immediately fails over to the next key automatically.
            </p>
          </div>
        </div>

        {onOpenKeyPool && (
          <button
            type="button"
            onClick={onOpenKeyPool}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-500/20 transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Manage Key Pool</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Developer Profile Card */}
        <div
          id="developer-profile-settings"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
            <User className="w-4 h-4 text-emerald-500" />
            <span>Developer Public Persona & Pitch Integration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">Your Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">Professional Title</label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">Portfolio Website URL</label>
              <input
                type="url"
                value={profile.portfolioUrl}
                onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">WhatsApp Phone Number</label>
              <input
                type="text"
                value={profile.whatsapp}
                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">Contact Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">Daily Outreach Cap (Anti-Spam)</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value) || 15)}
                max={50}
                min={1}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-zinc-600 dark:text-zinc-400">
              Hook / Special Value Proposition (Included in outreach messages)
            </label>
            <input
              type="text"
              value={profile.specialOffer}
              onChange={(e) => setProfile({ ...profile, specialOffer: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Lead Scoring Weights */}
        <div
          id="scoring-weights-settings"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
            <Sliders className="w-4 h-4 text-blue-500" />
            <span>Lead Opportunity Scoring Weights</span>
          </div>
          <p className="text-xs text-zinc-500">
            Adjust how much weight the AI assigns to specific digital pain points and business indicators.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">
                No Website Found (pts)
              </label>
              <input
                type="number"
                value={scoringWeights.noWebsite}
                onChange={(e) =>
                  setScoringWeights({ ...scoringWeights, noWebsite: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">
                Outdated / Non-Responsive Website (pts)
              </label>
              <input
                type="number"
                value={scoringWeights.outdatedWebsite}
                onChange={(e) =>
                  setScoringWeights({ ...scoringWeights, outdatedWebsite: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">
                Active Social Presence (pts)
              </label>
              <input
                type="number"
                value={scoringWeights.activeSocialPresence}
                onChange={(e) =>
                  setScoringWeights({ ...scoringWeights, activeSocialPresence: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
