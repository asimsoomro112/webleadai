'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Flame,
  Globe,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Check,
} from 'lucide-react';
import { Lead } from '@/lib/types';

import { AppSettings } from '@/lib/types';
import { apiFetch } from '@/lib/api-client';

interface DiscoveryEngineProps {
  settings?: AppSettings | null;
  onLeadsDiscovered: (newLeads: Lead[]) => void;
  onSelectLead: (lead: Lead) => void;
}

const CATEGORY_PRESETS = [
  'Restaurants',
  'Cafes & Bakeries',
  'Salons & Spas',
  'Barbershops',
  'Gyms & Fitness Centers',
  'Dental Clinics',
  'Doctors & Medical Clinics',
  'Real Estate Agencies',
  'Auto Repair Workshops',
  'Car Dealerships',
  'Hotels & Guest Houses',
  'Boutiques & Clothing Stores',
  'Construction & Contractors',
  'Cleaning Companies',
  'Photography Studios',
  'Event & Wedding Planners',
  'Travel Agencies',
  'Tuition & Education Centers',
];

const CITY_PRESETS = [
  { city: 'Karachi', country: 'Pakistan' },
  { city: 'Lahore', country: 'Pakistan' },
  { city: 'Islamabad', country: 'Pakistan' },
  { city: 'Dubai', country: 'United Arab Emirates' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Austin', country: 'United States' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Sydney', country: 'Australia' },
];

export function DiscoveryEngine({ onLeadsDiscovered, onSelectLead, settings }: DiscoveryEngineProps) {
  const [category, setCategory] = useState('Restaurants');
  const [city, setCity] = useState('Karachi');
  const [country, setCountry] = useState('Pakistan');
  const [keywords, setKeywords] = useState('');
  const [websiteStatusPreference, setWebsiteStatusPreference] = useState('NO_WEBSITE');
  const [minCount, setMinCount] = useState(5);
  const [autoResearch, setAutoResearch] = useState(true);
  const [autoGenerateMessage, setAutoGenerateMessage] = useState(true);

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredResults, setDiscoveredResults] = useState<Lead[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [discoveryLog, setDiscoveryLog] = useState<string[]>([]);

  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiscovering(true);
    setErrorMsg(null);
    setDiscoveredResults([]);
    setDiscoveryLog([
      `[1/4] Connecting to Google Search grounded intelligence...`,
      `[2/4] Scanning live directories & social presence for "${category}" in "${city}, ${country}"...`,
    ]);

    try {
      const res = await apiFetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          city,
          country,
          keywords,
          websiteStatusPreference,
          minCount,
          autoResearch,
          autoGenerateMessage,
          settings
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to discover leads');
      }

      setDiscoveryLog((prev) => [
        ...prev,
        `[3/4] Successfully identified ${data.leads.length} real businesses.`,
        `[4/4] Automated deep research, lead scoring, and personalized outreach drafts complete!`,
      ]);

      setDiscoveredResults(data.leads || []);
      onLeadsDiscovered(data.leads || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during discovery.');
      setDiscoveryLog((prev) => [...prev, `[ERROR] Discovery interrupted: ${err.message}`]);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Live Business Discovery Engine
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Google Search Grounded
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Find real local businesses with no website, outdated mobile layouts, or social-only presence ready for web development outreach.
          </p>
        </div>
      </div>

      {/* Discovery Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          id="discovery-form-card"
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
        >
          <form onSubmit={handleRunDiscovery} className="space-y-5">
            {/* Category selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                1. Target Business Industry / Category
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      category === cat
                        ? 'bg-emerald-600 text-white shadow-sm scale-105'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Or type custom category (e.g. Pet Grooming, Solar Installers)..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* City & Country selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>2. City</span>
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {CITY_PRESETS.map((loc) => (
                    <button
                      key={loc.city}
                      type="button"
                      onClick={() => {
                        setCity(loc.city);
                        setCountry(loc.country);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-medium ${
                        city === loc.city
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                      }`}
                    >
                      {loc.city}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Target city (e.g. Karachi, Lahore, Austin)..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Country
                </label>
                <div className="h-6"></div>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country (e.g. Pakistan, USA, UK)..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Target Website Status & Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>3. Priority Website Condition</span>
                </label>
                <select
                  value={websiteStatusPreference}
                  onChange={(e) => setWebsiteStatusPreference(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="NO_WEBSITE">Prioritize Businesses with NO Website</option>
                  <option value="OUTDATED">Prioritize Outdated / Broken Websites</option>
                  <option value="POOR_MOBILE">Prioritize Poor Mobile Experience</option>
                  <option value="ALL">All Potential Web Improvement Leads</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Target Lead Batch Size
                </label>
                <select
                  value={minCount}
                  onChange={(e) => setMinCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={3}>3 In-Depth Leads</option>
                  <option value={5}>5 Highly-Qualified Leads (Recommended)</option>
                  <option value={8}>8 Extended Leads Batch</option>
                </select>
              </div>
            </div>

            {/* Keyword refinement */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Optional Sub-Niche / Location Keywords
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. Clifton, DHA, fine dining, wedding makeup, CrossFit, cosmetic surgery..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Automated Pipeline Toggles */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoResearch}
                  onChange={(e) => setAutoResearch(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Auto-Run Deep Website Audit & Scoring
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerateMessage}
                  onChange={(e) => setAutoGenerateMessage(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Auto-Draft 4-Step Personalized Outreach
                </span>
              </label>
            </div>

            {/* Run button */}
            <button
              id="start-discovery-btn"
              type="submit"
              disabled={isDiscovering}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching Live Web & Grounding Real Prospects...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Run Autonomous Business Discovery</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Execution Console & Rules */}
        <div
          id="discovery-console-card"
          className="p-6 rounded-2xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span>Discovery Console</span>
              </div>
              <span className="text-[10px] text-zinc-500">Gemini 3.7 + Search Grounding</span>
            </div>

            <div className="font-mono text-[11px] leading-relaxed text-zinc-300 space-y-1.5 max-h-56 overflow-y-auto p-2 bg-black/40 rounded-lg border border-zinc-800/80">
              {discoveryLog.length === 0 ? (
                <div className="text-zinc-600 italic py-4 text-center">
                  Awaiting search trigger. Enter industry and location above to scan the live web.
                </div>
              ) : (
                discoveryLog.map((line, idx) => (
                  <div
                    key={idx}
                    className={line.startsWith('[ERROR]') ? 'text-rose-400' : 'text-emerald-300/90'}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compliance & Quality Guardrails</span>
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
              <li>Verified real local small businesses only (no fabricated placeholders)</li>
              <li>Rate-limited compliant outreach workflow</li>
              <li>Human approval gate before message dispatch</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Discovered Results Table / Cards */}
      {discoveredResults.length > 0 && (
        <div
          id="discovery-results-section"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Found {discoveredResults.length} Qualified Business Opportunities</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Audited and saved directly to your Lead CRM. Click any business to view deep intelligence and generated messages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {discoveredResults.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {lead.businessName}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lead.scoreBreakdown.tier === 'HOT'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      }`}
                    >
                      {lead.scoreBreakdown.totalScore}/100 {lead.scoreBreakdown.tier}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {lead.category} • {lead.city}
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-300 font-medium line-clamp-2">
                    {lead.painPoints[0] || 'Opportunity for modern web development overhaul.'}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ${lead.recommendedPrice} est. deal
                  </span>
                  <span className="text-zinc-400 group-hover:text-emerald-500 transition-colors flex items-center gap-1 font-medium text-[11px]">
                    Inspect & Message <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
