'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Flame,
  Globe,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  MapPin,
  Sparkles,
  MessageSquare,
  FileText,
  Clock,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Send,
  Bot,
  DollarSign,
  Plus,
  Zap,
  Target,
  FileCheck,
  Layers,
  ArrowUpRight,
  Building,
  HelpCircle,
  Mic,
  Lightbulb,
  Volume2,
} from 'lucide-react';
import { Lead, PipelineStatus, Proposal, WebsiteConcept, ProjectHandoff } from '@/lib/types';
import confetti from 'canvas-confetti';

import { AppSettings } from '@/lib/types';
import { apiFetch } from '@/lib/api-client';

interface LeadDetailDrawerProps {
  settings?: AppSettings | null;
  lead: Lead | null;
  onClose: () => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onGenerateOutreach: (lead: Lead) => Promise<void>;
  onSendOutreach: (leadId: string, channel: string, message: string, stepIndex: number) => Promise<void>;
  onGenerateProposal: (lead: Lead, tier: 'STARTER' | 'PROFESSIONAL' | 'PREMIUM', price?: number) => Promise<void>;
}

export function LeadDetailDrawer({
  settings,
  lead,
  onClose,
  onUpdateLead,
  onGenerateOutreach,
  onSendOutreach,
  onGenerateProposal,
}: LeadDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'audit' | 'concept' | 'outreach' | 'conversation' | 'copilot' | 'proposal' | 'activities'
  >('overview');

  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [copilotAnswer, setCopilotAnswer] = useState<string | null>(null);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // Reply simulation & ingestion
  const [prospectReplyInput, setProspectReplyInput] = useState('');
  const [isProcessingReply, setIsProcessingReply] = useState(false);
  const [replyClassificationResult, setReplyClassificationResult] = useState<any>(null);

  // Concept generation
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);

  // Project Handoff
  const [isGeneratingHandoff, setIsGeneratingHandoff] = useState(false);

  const [copiedIndex, setCopiedIndex] = useState<string | number | null>(null);
  const [newNote, setNewNote] = useState('');
  const [selectedProposalTier, setSelectedProposalTier] = useState<'STARTER' | 'PROFESSIONAL' | 'PREMIUM'>('PROFESSIONAL');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isRegeneratingOutreach, setIsRegeneratingOutreach] = useState(false);

  if (!lead) return null;

  const handleCopyText = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedNotes = [newNote.trim(), ...lead.notes];
    onUpdateLead(lead.id, { notes: updatedNotes });
    setNewNote('');
  };

  const handleAskCopilot = async (questionText: string) => {
    setCopilotQuestion(questionText);
    setIsCopilotLoading(true);
    setCopilotAnswer(null);

    try {
      const res = await apiFetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, settings, query: questionText }),
      });
      const data = await res.json();
      setCopilotAnswer(data.answer || 'No response generated.');
    } catch (err) {
      console.error(err);
      setCopilotAnswer('Error connecting to sales copilot.');
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleTriggerProposal = async () => {
    setIsGeneratingDoc(true);
    try {
      await onGenerateProposal(lead, selectedProposalTier);
      setActiveTab('proposal');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleStatusChange = (newStatus: PipelineStatus) => {
    onUpdateLead(lead.id, { status: newStatus });
    if (newStatus === 'WON') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleLaunchWhatsApp = (messageText: string) => {
    const rawPhone = (lead.phone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(messageText);
    const url = `https://wa.me/${rawPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Generate Website Concept
  const handleGenerateConcept = async () => {
    setIsGeneratingConcept(true);
    try {
      const res = await apiFetch('/api/concept/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, settings }),
      });
      const data = await res.json();
      if (data.lead) {
        onUpdateLead(lead.id, data.lead);
      }
    } catch (err) {
      console.error('Failed to generate concept:', err);
    } finally {
      setIsGeneratingConcept(false);
    }
  };

  // Process Ingested or Simulated Prospect Reply
  const handleProcessReply = async (customMessage?: string) => {
    const messageToSend = customMessage || prospectReplyInput;
    if (!messageToSend.trim()) return;

    setIsProcessingReply(true);
    try {
      const res = await apiFetch('/api/leads/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, settings, action: 'objection', objection: messageToSend.trim() }),
      });
      const data = await res.json();
      setReplyClassificationResult(data.replyDraft ? data : null);
      if (data.lead) {
        onUpdateLead(lead.id, data.lead);
      }
      setProspectReplyInput('');
    } catch (err) {
      console.error('Failed to process reply:', err);
    } finally {
      setIsProcessingReply(false);
    }
  };

  // Generate Project Handoff
  const handleGenerateHandoff = async () => {
    setIsGeneratingHandoff(true);
    try {
      const res = await apiFetch('/api/leads/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, settings }),
      });
      const data = await res.json();
      if (data.lead) {
        onUpdateLead(lead.id, data.lead);
      }
    } catch (err) {
      console.error('Failed to generate handoff:', err);
    } finally {
      setIsGeneratingHandoff(false);
    }
  };

  // Execute Next Best Action Shortcut
  const handleExecuteNextAction = async () => {
    if (!lead.nextBestAction) return;
    const action = lead.nextBestAction.action;

    if (action === 'RESEARCH_LEAD') {
      setActiveTab('audit');
    } else if (action === 'GENERATE_OUTREACH_MESSAGE') {
      setIsRegeneratingOutreach(true);
      try {
        await onGenerateOutreach(lead);
        setActiveTab('outreach');
      } finally {
        setIsRegeneratingOutreach(false);
      }
    } else if (action === 'BUILD_WEBSITE_CONCEPT') {
      setActiveTab('concept');
      handleGenerateConcept();
    } else if (action === 'SEND_INITIAL_OUTREACH' || action === 'SCHEDULE_FOLLOW_UP') {
      setActiveTab('outreach');
      if (lead.generatedMessage) {
        handleLaunchWhatsApp(lead.generatedMessage);
      }
    } else if (action === 'REVIEW_REPLY_AND_RESPOND' || action === 'HANDLE_OBJECTION') {
      setActiveTab('conversation');
    } else if (action === 'SEND_PROPOSAL_AGREEMENT') {
      setActiveTab('proposal');
      handleTriggerProposal();
    } else if (action === 'GENERATE_HANDOFF_PACKET') {
      setActiveTab('proposal');
      handleGenerateHandoff();
    }
  };

  return (
    <div
      id="lead-detail-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
    >
      {/* Drawer Top Header */}
      <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
              {lead.businessName}
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                lead.scoreBreakdown?.tier === 'HOT'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {lead.scoreBreakdown?.totalScore ?? 0}/100 {lead.scoreBreakdown?.tier || 'WARM'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{lead.category}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              {lead.city}, {lead.country}
            </span>
            <span>•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ${lead.dealValue || lead.recommendedPrice || 450} Deal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value as PipelineStatus)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="NEW">Stage: NEW</option>
            <option value="QUALIFIED">Stage: QUALIFIED</option>
            <option value="MESSAGE_READY">Stage: MESSAGE READY</option>
            <option value="CONTACTED">Stage: CONTACTED</option>
            <option value="REPLIED">Stage: REPLIED</option>
            <option value="INTERESTED">Stage: INTERESTED</option>
            <option value="CALL_BOOKED">Stage: CALL BOOKED</option>
            <option value="PROPOSAL_SENT">Stage: PROPOSAL SENT</option>
            <option value="NEGOTIATION">Stage: NEGOTIATION</option>
            <option value="OBJECTION_HANDLING">Stage: OBJECTION HANDLING</option>
            <option value="WON">🎉 WON CLIENT</option>
            <option value="LOST">Stage: LOST</option>
            <option value="DO_NOT_CONTACT">Stage: DO NOT CONTACT</option>
          </select>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Autonomous Next Best Action Banner */}
      {lead.nextBestAction?.action && (
        <div className="px-4 sm:px-6 py-3 bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  AI Next Best Action:
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {(lead.nextBestAction.action || '').replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {lead.nextBestAction.priority || lead.nextBestAction.urgency || 'HIGH'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {lead.nextBestAction.reasoning || lead.nextBestAction.reason || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleExecuteNextAction}
            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 transition-all"
          >
            <span>Take Action</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium overflow-x-auto no-scrollbar py-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Signals & Overview
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'audit'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Audit & Competitors</span>
          <span className="text-[10px] px-1 rounded bg-zinc-200 dark:bg-zinc-800">
            {lead.websiteAudit?.score || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('concept')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'concept'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <span>Live Concept</span>
          {lead.websiteConcept && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        </button>

        <button
          onClick={() => setActiveTab('outreach')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'outreach'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
          <span>Outreach Sequence</span>
        </button>

        <button
          onClick={() => setActiveTab('conversation')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'conversation'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span>Replies & Intent</span>
          {lead.conversationMemory?.messages?.length ? (
            <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-400">
              {lead.conversationMemory.messages.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('copilot')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'copilot'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-500" />
          <span>Sales Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('proposal')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'proposal'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-teal-500" />
          <span>Proposal & Handoff</span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'activities'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Notes & History
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 sm:pb-6 space-y-6 text-sm">
        {/* TAB 1: OVERVIEW & SIGNALS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Digital Opportunity Level Banner */}
            {lead.opportunityProfile && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Digital Opportunity Level:
                    </span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {lead.opportunityProfile.opportunityLevel}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    Conversion: {lead.opportunityProfile.conversionQuality}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-zinc-500 font-medium">Critical Gaps Identified:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {lead.opportunityProfile.digitalGaps.map((gap, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Verified Public Footprint */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Verified Contact Data
                </h3>
                {lead.verification && (
                  <span className="text-[10px] text-zinc-400">
                    Source: {lead.verification.sourceAttribution}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400">Phone:</span>{' '}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {lead.phone || 'Not publicly listed'}
                  </span>
                  {lead.verification?.phoneStatus === 'VERIFIED' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 inline ml-1" />
                  )}
                </div>
                <div>
                  <span className="text-zinc-400">Email:</span>{' '}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {lead.email || 'Not publicly listed'}
                  </span>
                  {lead.verification?.emailStatus === 'VERIFIED' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 inline ml-1" />
                  )}
                </div>
                <div>
                  <span className="text-zinc-400">Address:</span>{' '}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {lead.address || `${lead.city}, ${lead.country}`}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Google Reputation:</span>{' '}
                  <span className="font-semibold text-amber-500">
                    ★ {lead.googleRating} ({lead.googleReviewCount} reviews)
                  </span>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <span className="text-xs text-zinc-400">Footprint:</span>
                {lead.socials?.instagram && (
                  <a
                    href={lead.socials.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-pink-500 transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {lead.socials?.facebook && (
                  <a
                    href={lead.socials.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-blue-500 transition-colors"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                )}
                {lead.socials?.googleMaps && (
                  <a
                    href={lead.socials.googleMaps}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </a>
                )}
                {lead.phone && (
                  <button
                    onClick={() => handleLaunchWhatsApp(`Hi ${lead.businessName}, checking in regarding your web presence.`)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </button>
                )}
              </div>
            </div>

            {/* Growth Signals & Pain Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  <TrendingUp className="w-4 h-4" />
                  <span>Growth Signals (Why They Can Pay)</span>
                </div>
                <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                  {lead.growthSignals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Current Business Pain Points</span>
                </div>
                <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                  {lead.painPoints.map((pain, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Offer Strategy */}
            <div className="p-4 rounded-xl bg-zinc-900 dark:bg-zinc-900 text-zinc-50 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Recommended High-Converting Offer
                  </span>
                </div>
                <span className="text-sm font-black text-emerald-400">
                  ${lead.recommendedPrice || 450} USD
                </span>
              </div>
              <p className="text-sm font-semibold text-zinc-100">{lead.recommendedService}</p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('concept')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors"
                >
                  View Free Website Mockup
                </button>
                <button
                  onClick={() => setActiveTab('outreach')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors"
                >
                  Review Outreach Pitch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT & COMPETITOR GAP */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {lead.websiteAudit ? (
              <div className="space-y-6">
                {/* Score Summary */}
                <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                      Overall Digital Health Score
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Measured & inferred digital asset health for {lead.businessName}
                    </p>
                  </div>
                  <div className="text-3xl font-black text-rose-500">
                    {lead.websiteAudit.score}/100
                  </div>
                </div>

                {/* Performance Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">SSL Security</span>
                    <p className={`text-xs font-bold mt-1 ${lead.websiteAudit.hasHttps ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {lead.websiteAudit.hasHttps ? 'Active (HTTPS)' : 'Insecure / Missing'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Mobile Viewport</span>
                    <p className={`text-xs font-bold mt-1 ${lead.websiteAudit.isMobileResponsive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {lead.websiteAudit.isMobileResponsive ? 'Responsive' : 'Broken / None'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Speed Metric</span>
                    <p className="text-xs font-bold text-amber-500 mt-1">
                      {lead.websiteAudit.pageSpeedEstimate}/100 (Est)
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Local SEO</span>
                    <p className="text-xs font-bold text-amber-500 mt-1">
                      {lead.websiteAudit.seoBasicsScore}/100
                    </p>
                  </div>
                </div>

                {/* Competitor Gap Analysis */}
                {lead.competitorGap && (
                  <div className="p-4 rounded-xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                          Competitor Intelligence & Lost Revenue Gap
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-rose-500">
                        Lost Est: {lead.competitorGap.lostOpportunityEstimateMonthly}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      {lead.competitorGap.competitiveGapSummary}
                    </p>

                    {lead.competitorGap.competitorsFound?.length ? (
                      <div className="space-y-2 pt-2">
                        <p className="text-[11px] font-bold text-zinc-500">Nearby Competing Businesses:</p>
                        {lead.competitorGap.competitorsFound.map((comp, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {comp.competitorName}
                              </span>
                              <span className="text-zinc-500 ml-2">★ {comp.googleRating}</span>
                              <p className="text-[11px] text-zinc-400 mt-0.5">{comp.keyAdvantage}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                              {comp.hasOnlineBooking && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Booking
                                </span>
                              )}
                              {comp.hasWhatsAppCTA && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                                  WhatsApp
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {lead.competitorGap.recommendedDifferentiators?.length ? (
                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-zinc-500 mb-1.5">
                          How To Beat These Competitors:
                        </p>
                        <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                          {lead.competitorGap.recommendedDifferentiators.map((diff, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{diff}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Audit Problems and Opportunities */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Identified Problems
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    {lead.websiteAudit.problems.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                <Globe className="w-8 h-8 text-zinc-400 mx-auto" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Audit Not Yet Run</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Run deep audit to inspect digital presence, SSL certificate, mobile layout, and competitor benchmarks.
                </p>
                <button
                  onClick={() => onGenerateOutreach(lead)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Conduct Deep AI Audit
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FREE LIVE WEBSITE CONCEPT */}
        {activeTab === 'concept' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {lead.websiteConcept ? (
              <div className="space-y-6">
                {/* Concept Banner */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                        Interactive Live Concept Active
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {lead.websiteConcept.headline}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md">
                      {lead.websiteConcept.subheadline}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/preview/${lead.websiteConcept.previewId || lead.id}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all"
                    >
                      <span>Open Live Mockup</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() =>
                        handleCopyText(
                          `${window.location.origin}/preview/${lead.websiteConcept?.previewId || lead.id}`,
                          'concept_url'
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
                    >
                      {copiedIndex === 'concept_url' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Share Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Preview Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Color Palette & Structure */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Tailored Brand Palette
                  </h4>
                  <div className="flex items-center gap-4">
                    {Object.entries(lead.websiteConcept.colorPalette).map(([key, hex]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md border border-zinc-700 shadow-xs"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Sections in Concept */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Included Mockup Sections ({lead.websiteConcept.serviceSections?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(lead.websiteConcept.serviceSections || []).map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {sec.name}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-500">
                            {sec.priceStartingAt}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">{sec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Primary WhatsApp CTA:</span>
                    <span className="font-bold text-emerald-500">
                      &ldquo;{lead.websiteConcept.primaryCTA}&rdquo;
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Secondary Browse CTA:</span>
                    <span className="font-semibold text-zinc-300">
                      &ldquo;{lead.websiteConcept.secondaryCTA}&rdquo;
                    </span>
                  </div>
                </div>

                {/* Regenerate button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateConcept}
                    disabled={isGeneratingConcept}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingConcept ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingConcept ? 'Regenerating...' : 'Regenerate Mockup Concept'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                    No Free Website Concept Generated Yet
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                    Generate a tailored, high-converting interactive Next.js mockup for {lead.businessName}. You can share this live preview directly in your cold WhatsApp outreach!
                  </p>
                </div>
                <button
                  onClick={handleGenerateConcept}
                  disabled={isGeneratingConcept}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingConcept ? 'Crafting Concept...' : 'Generate Free Live Website Concept'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OUTREACH & WHATSAPP */}
        {activeTab === 'outreach' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1-Click WhatsApp Quick Action */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official WhatsApp Launcher (Compliant Direct Web Intent)</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Opens official WhatsApp Web or App with pre-filled pitch. No unapproved bot messaging.
                </p>
              </div>
              <button
                onClick={() =>
                  handleLaunchWhatsApp(
                    lead.generatedMessage ||
                      `Hi ${lead.businessName}, noticed your web growth potential in ${lead.city}. Would love to share an interactive concept.`
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Launch WhatsApp Chat
              </button>
            </div>

            {/* Personalized Primary Pitch */}
            <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Step 1: Initial Hook & Offer Pitch
                </span>
                <button
                  onClick={() =>
                    handleCopyText(
                      lead.generatedSubject
                        ? `Subject: ${lead.generatedSubject}\n\n${lead.generatedMessage}`
                        : lead.generatedMessage || '',
                      'primary_msg'
                    )
                  }
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                >
                  {copiedIndex === 'primary_msg' ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Pitch
                    </>
                  )}
                </button>
              </div>

              {lead.generatedSubject && (
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  Subject: <span className="font-normal text-zinc-600 dark:text-zinc-400">{lead.generatedSubject}</span>
                </div>
              )}

              <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed font-mono bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {lead.generatedMessage || 'Generating personalized pitch...'}
              </p>
            </div>

            {/* 4-Step Follow-Up Sequence */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Automated Follow-Up Sequence (RFC Compliant)
              </h4>
              <div className="space-y-3">
                {lead.followUpSequence?.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          Day {step.day}: {(step.type || '').replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          via {step.channel}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(step.body, idx)}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line bg-white dark:bg-zinc-950 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 font-mono">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONVERSATION & REPLY INTELLIGENCE */}
        {activeTab === 'conversation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Conversation Thread History */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Live Conversation Memory ({lead.conversationMemory?.messages?.length || 0} messages)
                </h4>
                {lead.conversationMemory?.currentIntent && lead.conversationMemory.currentIntent !== 'UNASSIGNED' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Intent: {(lead.conversationMemory.currentIntent || '').replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {lead.conversationMemory?.messages?.length ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {lead.conversationMemory.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs ${
                        msg.sender === 'PROSPECT'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-zinc-800 dark:text-zinc-200 mr-8'
                          : msg.sender === 'DEVELOPER'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-zinc-800 dark:text-zinc-200 ml-8 text-right'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 mx-4 text-center'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                        <span className="font-bold">
                          {msg.sender === 'PROSPECT' ? lead.businessName : (settings?.profile?.name || 'You')}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="whitespace-pre-line text-left">{msg.messageText}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic py-2">
                  No replies logged yet. Once your outreach is sent, paste the prospect&apos;s WhatsApp/email reply below (or pick a real-world objection) to classify intent and get instant closing guidance.
                </p>
              )}
            </div>

            {/* Ingest Client Reply & Objection Form */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Log Prospect Reply & Handle Objection
              </h4>

              {/* Preset Reply Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-400">Common Prospect Scenarios:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      handleProcessReply('How much would this cost and how long does it take to make?')
                    }
                    disabled={isProcessingReply}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-500/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    &ldquo;How much do you charge?&rdquo;
                  </button>
                  <button
                    onClick={() =>
                      handleProcessReply('We already have someone who manages our social media and stuff.')
                    }
                    disabled={isProcessingReply}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-500/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    &ldquo;We have a guy already&rdquo;
                  </button>
                  <button
                    onClick={() =>
                      handleProcessReply('Can you send over a live demo or mockup of how it looks?')
                    }
                    disabled={isProcessingReply}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-500/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    &ldquo;Can you send a demo?&rdquo;
                  </button>
                  <button
                    onClick={() =>
                      handleProcessReply('That sounds expensive. Can you do it for $250?')
                    }
                    disabled={isProcessingReply}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-500/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    &ldquo;Can you do $250?&rdquo;
                  </button>
                </div>
              </div>

              {/* Custom Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prospectReplyInput}
                  onChange={(e) => setProspectReplyInput(e.target.value)}
                  placeholder="Paste client's WhatsApp or email reply..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleProcessReply();
                  }}
                />
                <button
                  onClick={() => handleProcessReply()}
                  disabled={isProcessingReply || !prospectReplyInput.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shrink-0 disabled:opacity-50"
                >
                  {isProcessingReply ? 'Analyzing...' : 'Analyze Reply'}
                </button>
              </div>
            </div>

            {/* Classification Analysis & Winning Response */}
            {Boolean(
              replyClassificationResult?.replyDraft ||
              replyClassificationResult?.suggestedResponse ||
              lead.conversationMemory?.lastSuggestedResponse ||
              replyClassificationResult?.voiceNoteScript ||
              (lead.conversationMemory as any)?.suggestedVoiceNote
            ) && (() => {
              const counterPitch =
                replyClassificationResult?.replyDraft ||
                replyClassificationResult?.suggestedResponse ||
                lead.conversationMemory?.lastSuggestedResponse ||
                '';
              const voiceNote =
                replyClassificationResult?.voiceNoteScript ||
                (lead.conversationMemory as any)?.suggestedVoiceNote ||
                '';
              const closingTip =
                replyClassificationResult?.salesClosingTip ||
                (lead.conversationMemory as any)?.closingStrategy ||
                '';
              const actionStep =
                replyClassificationResult?.actionableStep ||
                replyClassificationResult?.recommendedNextAction ||
                (lead.conversationMemory as any)?.actionStep ||
                '';
              const detectedIntent =
                replyClassificationResult?.classifiedIntent ||
                lead.conversationMemory?.currentIntent ||
                '';

              return (
                <div className="space-y-4">
                  {/* Header & Intent Classification Tag */}
                  <div className="p-4 rounded-xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/20 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                          AI Objection Counter-Pitch (Direct Reply)
                        </span>
                      </div>
                      {detectedIntent && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          Intent: {detectedIntent.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    {counterPitch && (
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line bg-white dark:bg-zinc-950 p-3 rounded-lg border border-purple-500/20 font-mono">
                        {counterPitch}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {actionStep && (
                        <span className="text-[11px] text-zinc-400">
                          Next move: <strong className="text-zinc-300">{actionStep}</strong>
                        </span>
                      )}
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => handleCopyText(counterPitch, 'suggested_resp')}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
                        >
                          {copiedIndex === 'suggested_resp' ? 'Copied!' : 'Copy Reply'}
                        </button>
                        <button
                          onClick={() => handleLaunchWhatsApp(counterPitch)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-sm"
                        >
                          Send on WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 20-30s WhatsApp Voice-Note Script Card */}
                  {voiceNote && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 space-y-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                                30s WhatsApp Voice-Note Script
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                3.2x Higher Response
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Record this aloud casually in WhatsApp voice notes instead of sending text walls.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyText(voiceNote, 'voice_script')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedIndex === 'voice_script' ? 'Copied!' : 'Copy Script'}</span>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-lg bg-white/80 dark:bg-zinc-950/80 border border-emerald-500/20 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans italic relative">
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mb-1.5 not-italic font-bold">
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                          <span>Voice Recording Script:</span>
                        </div>
                        &ldquo;{voiceNote}&rdquo;
                      </div>
                    </div>
                  )}

                  {/* Sales Psychology & Closing Strategy */}
                  {closingTip && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 flex items-start gap-2.5 text-xs">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-200 block mb-0.5">
                          Sales Closing Strategy & Leverage:
                        </span>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {closingTip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 6: AI SALES COPILOT */}
        {activeTab === 'copilot' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Strategic Tactics */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Objection Battlecards & Winning Plays
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    handleAskCopilot(`How do I respond if ${lead.businessName} says "Price is too high / we don't have budget"?`)
                  }
                  className="p-3 text-left rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-colors"
                >
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                    &ldquo;Price Is Too High&rdquo;
                  </span>
                  <span className="text-[11px] text-zinc-500">How to reframe around ROI and lost bookings.</span>
                </button>

                <button
                  onClick={() =>
                    handleAskCopilot(`How do I counter ${lead.businessName} saying "Instagram is enough for our business"?`)
                  }
                  className="p-3 text-left rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-colors"
                >
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                    &ldquo;Instagram Is Enough&rdquo;
                  </span>
                  <span className="text-[11px] text-zinc-500">Highlight 60% DM drop-off & Google searchers.</span>
                </button>

                <button
                  onClick={() =>
                    handleAskCopilot(`What is the fastest way to get ${lead.businessName} on a 10-minute discovery call?`)
                  }
                  className="p-3 text-left rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-colors"
                >
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                    Fast Call Booking
                  </span>
                  <span className="text-[11px] text-zinc-500">Hook them with the live interactive concept preview.</span>
                </button>

                <button
                  onClick={() =>
                    handleAskCopilot(`How to close a 50% deposit upfront from ${lead.businessName} without resistance?`)
                  }
                  className="p-3 text-left rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-colors"
                >
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                    50% Upfront Closing Script
                  </span>
                  <span className="text-[11px] text-zinc-500">Milestone-based contract and delivery guarantee.</span>
                </button>
              </div>
            </div>

            {/* Custom Question */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Ask Tactical Sales Copilot
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={copilotQuestion}
                  onChange={(e) => setCopilotQuestion(e.target.value)}
                  placeholder="Ask anything about closing this lead..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && copilotQuestion.trim()) {
                      handleAskCopilot(copilotQuestion.trim());
                    }
                  }}
                />
                <button
                  onClick={() => handleAskCopilot(copilotQuestion.trim())}
                  disabled={isCopilotLoading || !copilotQuestion.trim()}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 disabled:opacity-50"
                >
                  {isCopilotLoading ? 'Thinking...' : 'Ask Copilot'}
                </button>
              </div>
            </div>

            {/* Answer Display */}
            {copilotAnswer && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <Bot className="w-4 h-4" />
                  <span>Sales Copilot Tactical Advice</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {copilotAnswer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: PROPOSAL & PROJECT HANDOFF */}
        {activeTab === 'proposal' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Won Client Project Handoff Packet */}
            {lead.status === 'WON' || lead.projectHandoff ? (
              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                        🎉 Client Won — Project Handoff & Agreement Packet
                      </h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Total Deal: ${lead.projectHandoff?.totalContractValue || lead.dealValue} USD (50% Deposit: ${lead.projectHandoff?.depositAmount || Math.round((lead.dealValue || 450) * 0.5)})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const text = lead.projectHandoff?.contractAgreementMarkdown || 'Agreement';
                      handleCopyText(text, 'agreement_doc');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                  >
                    {copiedIndex === 'agreement_doc' ? 'Copied Agreement!' : 'Copy Agreement'}
                  </button>
                </div>

                {lead.projectHandoff ? (
                  <div className="space-y-4 pt-2 border-t border-emerald-500/20 text-xs">
                    {/* Deliverables */}
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Project Deliverables:</h4>
                      <div className="space-y-1.5">
                        {lead.projectHandoff.deliverables.map((deliv, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-semibold">{deliv.name}: </span>
                              <span className="text-zinc-500">{deliv.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Client Onboarding Checklist */}
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Client Onboarding Checklist:</h4>
                      <div className="space-y-1">
                        {lead.projectHandoff.clientOnboardingChecklist.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                            <span className="w-3.5 h-3.5 rounded border border-zinc-500 flex items-center justify-center text-[9px]">
                              {item.received ? '✓' : ''}
                            </span>
                            <span>{item.item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Retainer Offer */}
                    <div className="p-3 rounded-lg bg-zinc-900 text-zinc-100">
                      <span className="text-[11px] font-bold text-emerald-400">Post-Launch Retainer Upsell: </span>
                      <span className="text-xs">${lead.projectHandoff.maintenanceRetainerOffer?.monthlyFee || 49}/month for ongoing updates, backups & maintenance.</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateHandoff}
                    disabled={isGeneratingHandoff}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    {isGeneratingHandoff ? 'Generating...' : 'Generate Complete Project Handoff Packet'}
                  </button>
                )}
              </div>
            ) : null}

            {/* Proposal Generator Controls */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Generate Proposal Document
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedProposalTier}
                  onChange={(e) => setSelectedProposalTier(e.target.value as any)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="STARTER">Starter Launchpad ($199)</option>
                  <option value="PROFESSIONAL">Business Growth ($499)</option>
                  <option value="PREMIUM">Full Scale Platform ($999)</option>
                </select>

                <button
                  onClick={handleTriggerProposal}
                  disabled={isGeneratingDoc}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors"
                >
                  {isGeneratingDoc ? 'Generating...' : 'Generate Official PDF/Markdown Proposal'}
                </button>
              </div>
            </div>

            {/* Existing Proposals List */}
            {lead.proposals?.length ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Proposals Generated ({lead.proposals.length})
                </h4>
                {lead.proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {prop.title || `${prop.packageTier} Website Proposal`}
                      </span>
                      <span className="text-sm font-black text-emerald-500">
                        ${prop.totalPrice} USD
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{prop.recommendedSolution}</p>

                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                      <button
                        onClick={() =>
                          handleCopyText(
                            prop.markdownContent ||
                              `# Proposal: ${prop.businessName}\n\n**Solution:** ${prop.recommendedSolution}\n\n**Package:** ${prop.packageTier} ($${prop.totalPrice} USD)\n\n**Scope:**\n${(prop.scopeFeatures || []).map((f) => `- ${f.feature}: ${f.benefit}`).join('\n')}\n\n**Timeline:** ${prop.timelineWeeks} week(s)\n**Revision Policy:** ${prop.revisionPolicy}`,
                            prop.id
                          )
                        }
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                      >
                        {copiedIndex === prop.id ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Copied Full Proposal
                          </span>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Full Proposal
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 8: NOTES & ACTIVITY HISTORY */}
        {activeTab === 'activities' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Add Note Form */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Add Private Note
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record client preference, call notes, or follow-up promise..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNote();
                  }}
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs shrink-0"
                >
                  Save Note
                </button>
              </div>

              {lead.notes?.length ? (
                <div className="space-y-1.5 pt-2">
                  {lead.notes.map((note, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Audit & Action Log */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Timeline & Activity Log
              </h4>
              <div className="space-y-2">
                {lead.activities?.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        {act.title}
                      </span>
                      {act.details && (
                        <p className="text-zinc-500 mt-0.5">{act.details}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                      {new Date(act.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Quick Action Bar */}
      <div className="sm:hidden p-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 z-10 shrink-0">
        {lead.phone && (
          <a
            href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 transition-colors shrink-0"
            title="Call Client"
          >
            <Phone className="w-4 h-4" />
          </a>
        )}

        <button
          onClick={() => {
            const msg =
              replyClassificationResult?.replyDraft ||
              lead.generatedMessage ||
              lead.followUpSequence?.[0]?.body ||
              `Hi ${lead.businessName}, checking in regarding your website!`;
            handleLaunchWhatsApp(msg);
          }}
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Launch WhatsApp</span>
        </button>

        {lead.nextBestAction?.action && (
          <button
            onClick={handleExecuteNextAction}
            className="py-2.5 px-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center gap-1 shrink-0 active:scale-95 transition-transform shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>Next Move</span>
          </button>
        )}
      </div>
    </div>
  );
}
