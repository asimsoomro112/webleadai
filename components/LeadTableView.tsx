'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Flame,
  Globe,
  ExternalLink,
  MessageSquare,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  ChevronRight,
  MoreVertical,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { Lead, PipelineStatus, WebsiteStatus } from '@/lib/types';

interface LeadTableViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: PipelineStatus) => void;
  onQuickWhatsApp: (lead: Lead) => void;
  onQuickGenerateProposal: (lead: Lead) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function LeadTableView({
  leads,
  onSelectLead,
  onUpdateStatus,
  onQuickWhatsApp,
  onQuickGenerateProposal,
  searchQuery,
  setSearchQuery,
}: LeadTableViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedWebsiteStatus, setSelectedWebsiteStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'newest' | 'oldest'>('score');

  // Extract unique categories & cities for filters
  const categories = Array.from(new Set(leads.map((l) => l.category))).filter(Boolean);
  const cities = Array.from(new Set(leads.map((l) => l.city))).filter(Boolean);

  // Apply filters
  const filteredLeads = leads.filter((l) => {
    if (selectedCategory !== 'ALL' && l.category !== selectedCategory) return false;
    if (selectedCity !== 'ALL' && l.city !== selectedCity) return false;
    if (selectedStatus !== 'ALL' && l.status !== selectedStatus) return false;
    if (selectedTier !== 'ALL' && l.scoreBreakdown.tier !== selectedTier) return false;
    if (selectedWebsiteStatus !== 'ALL' && l.websiteStatus !== selectedWebsiteStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.businessName.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Apply sorting
  filteredLeads.sort((a, b) => {
    if (sortBy === 'score') return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
    if (sortBy === 'value') return (b.dealValue || 0) - (a.dealValue || 0);
    if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime();
    return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Lead CRM Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            High-density database of real business prospects, website audits, outreach sequences, and deals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing <strong className="text-zinc-900 dark:text-zinc-100">{filteredLeads.length}</strong> of{' '}
            {leads.length} leads
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        id="leads-filter-bar"
        className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Score Tier
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Tiers</option>
              <option value="HOT">🔥 HOT (90-100)</option>
              <option value="HIGH">⚡ HIGH (75-89)</option>
              <option value="MEDIUM">MEDIUM (50-74)</option>
              <option value="LOW">LOW (0-49)</option>
            </select>
          </div>

          {/* Website Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Website Status
            </label>
            <select
              value={selectedWebsiteStatus}
              onChange={(e) => setSelectedWebsiteStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Website Statuses</option>
              <option value="NO_WEBSITE">No Website</option>
              <option value="OUTDATED">Outdated</option>
              <option value="POOR_MOBILE">Poor Mobile</option>
              <option value="BROKEN">Broken</option>
              <option value="WEAK_SEO">Weak SEO</option>
            </select>
          </div>

          {/* Pipeline Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Pipeline Stage
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Stages</option>
              <option value="NEW">NEW</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="MESSAGE_READY">MESSAGE READY</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="REPLIED">REPLIED</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="CALL_BOOKED">CALL BOOKED</option>
              <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
              <option value="WON">WON CLIENT</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="score">Highest Score</option>
              <option value="value">Highest Deal Value</option>
              <option value="newest">Recently Discovered</option>
              <option value="oldest">Oldest Discovered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        id="leads-data-table-container"
        className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Business / Prospect</th>
                <th className="py-3 px-4">Category & Location</th>
                <th className="py-3 px-4">Website & Audit</th>
                <th className="py-3 px-4">Opportunity Score</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Primary Channel</th>
                <th className="py-3 px-4 text-right">Potential Value</th>
                <th className="py-3 px-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No leads match the selected criteria. Try adjusting your filters or run a new discovery!
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-950/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectLead(lead)}
                  >
                    {/* Business Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 flex-wrap">
                        <span>{lead.businessName}</span>
                        {lead.scoreBreakdown.tier === 'HOT' && (
                          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        {lead.websiteConcept && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            Live Mockup Ready
                          </span>
                        )}
                      </div>
                      {lead.nextBestAction && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Next: {lead.nextBestAction.action.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {lead.description}
                      </div>
                    </td>

                    {/* Category & City */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">
                        {lead.category}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {lead.city}, {lead.country}
                      </div>
                    </td>

                    {/* Website status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            lead.websiteStatus === 'NO_WEBSITE'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              : lead.websiteStatus === 'OUTDATED'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {lead.websiteStatus.replace('_', ' ')}
                        </span>
                        {lead.websiteAudit && (
                          <span className="text-[10px] text-zinc-400">
                            Score: {lead.websiteAudit.score}/100
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Opportunity Score */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`font-bold text-xs px-2 py-1 rounded-md ${
                            lead.scoreBreakdown.tier === 'HOT'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : lead.scoreBreakdown.tier === 'HIGH'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {lead.scoreBreakdown.totalScore}/100
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-500">
                          {lead.scoreBreakdown.tier}
                        </span>
                      </div>
                    </td>

                    {/* Pipeline Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => onUpdateStatus(lead.id, e.target.value as PipelineStatus)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:ring-1 focus:outline-none transition-colors ${
                          lead.status === 'WON'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : lead.status === 'INTERESTED' || lead.status === 'CALL_BOOKED'
                            ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                            : lead.status === 'MESSAGE_READY' || lead.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="MESSAGE_READY">MESSAGE READY</option>
                        <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="REPLIED">REPLIED</option>
                        <option value="INTERESTED">INTERESTED</option>
                        <option value="CALL_BOOKED">CALL BOOKED</option>
                        <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="WON">🎉 WON CLIENT</option>
                        <option value="LOST">LOST</option>
                        <option value="DO_NOT_CONTACT">DO NOT CONTACT</option>
                      </select>
                    </td>

                    {/* Primary Channel */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {lead.primaryChannel === 'WHATSAPP' && <Phone className="w-3 h-3 text-emerald-500" />}
                        {lead.primaryChannel === 'EMAIL' && <Mail className="w-3 h-3 text-blue-500" />}
                        <span>{lead.primaryChannel}</span>
                      </span>
                    </td>

                    {/* Deal Value */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-zinc-900 dark:text-zinc-100">
                      ${lead.dealValue || lead.recommendedPrice || 450}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onQuickWhatsApp(lead)}
                          title="Launch WhatsApp Pitch"
                          className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded text-emerald-600 dark:text-emerald-400 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onQuickGenerateProposal(lead)}
                          title="Generate Proposal"
                          className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded text-purple-600 dark:text-purple-400 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectLead(lead)}
                          title="Open Full Intelligence Drawer"
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
