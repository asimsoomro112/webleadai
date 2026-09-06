'use client';

import React from 'react';
import {
  Flame,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Lead, PipelineStatus } from '@/lib/types';

interface KanbanBoardViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: PipelineStatus) => void;
  onQuickWhatsApp: (lead: Lead) => void;
}

interface ColumnConfig {
  id: PipelineStatus;
  title: string;
  badgeColor: string;
  statuses: PipelineStatus[];
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  {
    id: 'NEW',
    title: 'New & Discovered',
    badgeColor: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
    statuses: ['NEW', 'RESEARCHING'],
  },
  {
    id: 'QUALIFIED',
    title: 'Qualified / Audit Ready',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    statuses: ['QUALIFIED'],
  },
  {
    id: 'MESSAGE_READY',
    title: 'Outreach Drafted',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    statuses: ['MESSAGE_READY', 'PENDING_APPROVAL'],
  },
  {
    id: 'CONTACTED',
    title: 'Contacted',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    statuses: ['CONTACTED'],
  },
  {
    id: 'INTERESTED',
    title: 'Replied & Interested',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    statuses: ['REPLIED', 'INTERESTED'],
  },
  {
    id: 'PROPOSAL_SENT',
    title: 'Calls & Proposals',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    statuses: ['CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION'],
  },
  {
    id: 'WON',
    title: '🎉 Won Clients',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    statuses: ['WON'],
  },
];

export function KanbanBoardView({
  leads,
  onSelectLead,
  onUpdateStatus,
  onQuickWhatsApp,
}: KanbanBoardViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Client Pipeline Kanban
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Track each prospect&apos;s journey from initial web discovery to approved outreach, negotiation, and closed client.
        </p>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar min-h-[600px]">
        {KANBAN_COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => col.statuses.includes(l.status));
          const colTotalValue = colLeads.reduce(
            (sum, l) => sum + (l.dealValue || l.recommendedPrice || 450),
            0
          );

          return (
            <div
              key={col.id}
              className="w-72 shrink-0 flex flex-col rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${col.badgeColor}`}>
                    {colLeads.length}
                  </span>
                  <h2 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    {col.title}
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-zinc-500">
                  ${colTotalValue}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar max-h-[70vh]">
                {colLeads.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs italic">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 shadow-sm hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer group space-y-2.5"
                    >
                      {/* Top Row: Name & Score */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {lead.businessName}
                        </h3>
                        {lead.scoreBreakdown?.tier === 'HOT' && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            HOT
                          </span>
                        )}
                      </div>

                      {/* Category & City */}
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                        <span>{lead.category}</span>
                        <span>{lead.city}</span>
                      </div>

                      {/* Main Problem / Pain Point */}
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-tight">
                        {(lead.painPoints && lead.painPoints[0]) || lead.description || 'Active business opportunity'}
                      </p>

                      {/* Next Best Action Tag */}
                      {lead.nextBestAction?.action && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="truncate">Next: {lead.nextBestAction.action.replace(/_/g, ' ')}</span>
                        </div>
                      )}

                      {lead.websiteConcept && (
                        <div className="text-[10px] text-blue-500 font-semibold flex items-center gap-1">
                          <span>🌐 Live Mockup Ready</span>
                        </div>
                      )}

                      {/* Value & Channel */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ${lead.dealValue || lead.recommendedPrice || 450}
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {lead.phone && (
                            <button
                              onClick={() => onQuickWhatsApp(lead)}
                              title="Launch WhatsApp Web"
                              className="p-1 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <select
                            value={lead.status}
                            onChange={(e) => onUpdateStatus(lead.id, e.target.value as PipelineStatus)}
                            className="text-[10px] py-0.5 px-1 rounded bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-600 dark:text-zinc-300 focus:outline-none"
                          >
                            <option value="NEW">New</option>
                            <option value="QUALIFIED">Qualified</option>
                            <option value="MESSAGE_READY">Outreach Ready</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="INTERESTED">Interested</option>
                            <option value="CALL_BOOKED">Call Booked</option>
                            <option value="PROPOSAL_SENT">Proposal Sent</option>
                            <option value="WON">Won Client</option>
                            <option value="LOST">Lost</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
