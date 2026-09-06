'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  Flame,
  MailCheck,
  PhoneCall,
  CheckCircle2,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AnalyticsMetrics, Lead } from '@/lib/types';

interface DashboardViewProps {
  analytics: AnalyticsMetrics | null;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onNavigateToDiscover: () => void;
  onNavigateToCRM: () => void;
}

export function DashboardView({
  analytics,
  leads,
  onSelectLead,
  onNavigateToDiscover,
  onNavigateToCRM,
}: DashboardViewProps) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
        <span>Loading performance metrics...</span>
      </div>
    );
  }

  const hotLeads = leads.filter((l) => l.scoreBreakdown?.tier === 'HOT').slice(0, 5);
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.updatedAt || (b as any).createdAt || 0).getTime() - new Date(a.updatedAt || (a as any).createdAt || 0).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Hero Summary */}
      <div
        id="dashboard-hero-card"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8 text-white border border-zinc-800 shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Real Business Acquisition Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Autonomous Web-Dev Client Pipeline
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Continuously researching live local businesses in your target cities with weak or missing websites, generating high-converting personalized offers, and tracking conversions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="hero-discover-btn"
              onClick={onNavigateToDiscover}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Discover New Leads</span>
            </button>
            <button
              id="hero-crm-btn"
              onClick={onNavigateToCRM}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm border border-zinc-700 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              <span>View Full CRM ({analytics.totalLeads})</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle backdrop */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Stats Grid */}
      <div
        id="kpi-metrics-grid"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
      >
        {/* Total Leads */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {analytics.totalLeads}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
            {analytics.newLeads} new awaiting review
          </span>
        </div>

        {/* HOT Leads */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">HOT Leads</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {analytics.hotLeads}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
            90+ score opportunities
          </span>
        </div>

        {/* Contacted / Outreach */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Contacted</span>
            <MailCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {analytics.contactedCount}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
            {analytics.repliesCount} replies received
          </span>
        </div>

        {/* Interested / Calls */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Calls / Int.</span>
            <PhoneCall className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {analytics.interestedCount + analytics.callsBookedCount}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
            {analytics.callsBookedCount} calls scheduled
          </span>
        </div>

        {/* Won Clients */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Won Clients</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {analytics.wonCount}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
            {analytics.conversionRate}% conversion rate
          </span>
        </div>

        {/* Pipeline Value */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ${analytics.pipelineValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
            ${analytics.realizedRevenue.toLocaleString()} closed
          </span>
        </div>
      </div>

      {/* Middle Section: Visual Funnel & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <div
          id="conversion-funnel-card"
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Conversion Pipeline Funnel
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Real-time conversion efficiency from discovery to won client contracts
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {analytics.conversionRate}% Win Rate
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.funnelSteps.map((step, idx) => {
              const maxCount = analytics.funnelSteps[0].count || 1;
              const widthPct = Math.max(Math.round((step.count / maxCount) * 100), 8);
              return (
                <div key={step.step} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {step.step}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {step.count}
                      </span>
                      {idx > 0 && (
                        <span className="text-[11px] text-zinc-400">
                          ({100 - step.dropoffPercentage}% retain)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-blue-500'
                          : idx === 1
                          ? 'bg-teal-500'
                          : idx === 2
                          ? 'bg-emerald-500'
                          : idx === 3
                          ? 'bg-amber-500'
                          : idx === 4
                          ? 'bg-purple-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leads by Category */}
        <div
          id="category-distribution-card"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Top Industries
            </h2>
            <span className="text-xs text-zinc-400">By Lead Volume</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.categoryDistribution.slice(0, 5).map((cat) => {
              const maxCatCount = Math.max(...analytics.categoryDistribution.map((c) => c.count), 1);
              const pct = Math.round((cat.count / maxCatCount) * 100);
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                      {cat.category}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {cat.count} leads (${cat.value})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Section: High Priority HOT Opportunities & Recent Discoveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority HOT Leads */}
        <div
          id="hot-leads-section"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Top Priority HOT Leads
              </h2>
            </div>
            <button
              onClick={onNavigateToCRM}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {hotLeads.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                No hot leads yet. Run a discovery to find top opportunities!
              </div>
            ) : (
              hotLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {lead.businessName}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        {lead.scoreBreakdown?.totalScore ?? 0}/100 HOT
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>{lead.category}</span>
                      <span>•</span>
                      <span>{lead.city}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ${lead.recommendedPrice} est. deal
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                      {lead.status}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Pipeline Activity & Leads */}
        <div
          id="recent-activity-section"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Discovered Prospects
            </h2>
            <button
              onClick={onNavigateToDiscover}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Discover More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {lead.businessName}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {(lead.websiteStatus || 'NO_WEBSITE').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {(lead.painPoints && lead.painPoints[0]) || lead.description || 'Active business opportunity'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {lead.scoreBreakdown?.totalScore ?? 0}/100
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {lead.city}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
