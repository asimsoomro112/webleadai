'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { DiscoveryEngine } from '@/components/DiscoveryEngine';
import { LeadTableView } from '@/components/LeadTableView';
import { KanbanBoardView } from '@/components/KanbanBoardView';
import { LeadDetailDrawer } from '@/components/LeadDetailDrawer';
import { AgentControlCenter } from '@/components/AgentControlCenter';
import { SettingsView } from '@/components/SettingsView';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { ApiKeyPoolModal } from '@/components/ApiKeyPoolModal';
import { AuthModal } from '@/components/AuthModal';
import { Lead, AnalyticsMetrics, AppSettings, AppNotification, AgentTask, PipelineStatus } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import {
  subscribeUserLeads,
  subscribeUserSettings,
  subscribeUserNotifications,
  subscribeUserTasks,
  saveUserLead,
  saveUserSettings,
} from '@/lib/firestoreService';
import { apiFetch } from '@/lib/api-client';
import { normalizeLead } from '@/lib/lead-utils';

export default function Home() {
  const { user, userProfile, userSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'discover' | 'crm-table' | 'crm-kanban' | 'agent' | 'proposals' | 'settings'
  >('dashboard');

  const [leads, setLeads] = useState<Lead[]>([]);
  const analytics = useMemo(() => {
    const qualifiedLeads = leads.filter(
      (lead) => !['NEW', 'LOST', 'DO_NOT_CONTACT'].includes(lead.status),
    ).length;
    const contactedCount = leads.filter((lead) =>
      ['CONTACTED', 'REPLIED', 'INTERESTED', 'CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(lead.status),
    ).length;
    const repliesCount = leads.filter((lead) =>
      ['REPLIED', 'INTERESTED', 'CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(lead.status),
    ).length;
    const interestedCount = leads.filter((lead) =>
      ['INTERESTED', 'CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(lead.status),
    ).length;
    const callsBookedCount = leads.filter((lead) =>
      ['CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(lead.status),
    ).length;
    const proposalsSentCount = leads.filter((lead) =>
      ['PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(lead.status),
    ).length;
    const wonCount = leads.filter((lead) => lead.status === 'WON').length;
    const pipelineValue = leads
      .filter((lead) => !['LOST', 'DO_NOT_CONTACT'].includes(lead.status))
      .reduce((total, lead) => total + (lead.dealValue || lead.recommendedPrice || 450), 0);
    const realizedRevenue = leads
      .filter((lead) => lead.status === 'WON')
      .reduce((total, lead) => total + (lead.dealValue || lead.recommendedPrice || 450), 0);

    const categoryMetrics = new Map<string, { count: number; value: number }>();
    const locationMetrics = new Map<string, number>();
    const statusMetrics = new Map<PipelineStatus, number>();
    leads.forEach((lead) => {
      const category = lead.category || 'General';
      const city = lead.city || 'Karachi';
      const status = (lead.status || 'NEW') as PipelineStatus;
      const catMetric = categoryMetrics.get(category) ?? { count: 0, value: 0 };
      categoryMetrics.set(category, {
        count: catMetric.count + 1,
        value: catMetric.value + (lead.dealValue || lead.recommendedPrice || 450),
      });
      locationMetrics.set(city, (locationMetrics.get(city) ?? 0) + 1);
      statusMetrics.set(status, (statusMetrics.get(status) ?? 0) + 1);
    });

    return {
      totalLeads: leads.length,
      newLeads: leads.filter((lead) => lead.status === 'NEW').length,
      qualifiedLeads,
      hotLeads: leads.filter((lead) => lead.scoreBreakdown?.tier === 'HOT').length,
      contactedCount,
      repliesCount,
      interestedCount,
      callsBookedCount,
      proposalsSentCount,
      wonCount,
      conversionRate: leads.length ? Number(((wonCount / leads.length) * 100).toFixed(1)) : 0,
      pipelineValue,
      realizedRevenue,
      categoryDistribution: Array.from(categoryMetrics, ([category, metrics]) => ({ category, ...metrics })),
      locationDistribution: Array.from(locationMetrics, ([city, count]) => ({ city, count })),
      statusDistribution: Array.from(statusMetrics, ([status, count]) => ({ status, count })),
      funnelSteps: [
        { step: 'Discovered', count: leads.length, dropoffPercentage: 0 },
        { step: 'Qualified', count: qualifiedLeads, dropoffPercentage: leads.length ? Math.round(((leads.length - qualifiedLeads) / leads.length) * 100) : 0 },
        { step: 'Contacted', count: contactedCount, dropoffPercentage: qualifiedLeads ? Math.round(((qualifiedLeads - contactedCount) / qualifiedLeads) * 100) : 0 },
        { step: 'Replies', count: repliesCount, dropoffPercentage: contactedCount ? Math.round(((contactedCount - repliesCount) / contactedCount) * 100) : 0 },
        { step: 'Interested / Calls', count: interestedCount + callsBookedCount, dropoffPercentage: repliesCount ? Math.round(((repliesCount - (interestedCount + callsBookedCount)) / repliesCount) * 100) : 0 },
        { step: 'Won Clients', count: wonCount, dropoffPercentage: proposalsSentCount ? Math.round(((proposalsSentCount - wonCount) / proposalsSentCount) * 100) : 0 },
      ],
    };
  }, [leads]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [agentStatus, setAgentStatus] = useState<'IDLE' | 'RUNNING' | 'PAUSED'>('IDLE');
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Keep the first client render identical to SSR. Theme preference is browser-only.
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('weblead_theme');
      if (savedTheme === 'dark') setDarkMode(true);
      else if (savedTheme !== 'light') setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {
      // Keep the server-rendered light theme when browser storage is unavailable.
    }
  }, []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showApiKeyPool, setShowApiKeyPool] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [keyPoolCount, setKeyPoolCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize document dark class with state
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleToggleDarkMode = (nextVal: boolean) => {
    setDarkMode(nextVal);
    try {
      if (nextVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('weblead_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('weblead_theme', 'light');
      }
    } catch {
      // ignore
    }
  };

  // Initial Data Load
  const fetchAllData = useCallback(async () => {
    try {
      const [leadsRes, settingsRes, notifRes, agentRes, keysRes] = await Promise.all([
        apiFetch('/api/leads'),
        apiFetch('/api/settings'),
        apiFetch('/api/notifications'),
        apiFetch('/api/agent/control'),
        apiFetch('/api/keys'),
      ]);

      if (leadsRes.ok) {
        const d = await leadsRes.json();
        setLeads((d.leads || []).map(normalizeLead));
      }
      if (settingsRes.ok) {
        const d = await settingsRes.json();
        setSettings(d.settings);
      }
      if (notifRes.ok) {
        const d = await notifRes.json();
        setNotifications(d.notifications || []);
      }
      if (agentRes.ok) {
        const d = await agentRes.json();
        setAgentStatus(d.status || 'IDLE');
        setAgentTasks(d.tasks || []);
      }
      if (keysRes.ok) {
        const d = await keysRes.json();
        if (d.pool) {
          setKeyPoolCount(d.pool.totalKeys || 1);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await fetchAllData();
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchAllData]);

  useEffect(() => {
    if (!userSettings) return;
    const frame = requestAnimationFrame(() => setSettings(userSettings));
    return () => cancelAnimationFrame(frame);
  }, [userSettings]);



  // Real-time Firestore synchronization per authenticated user
  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to User Leads
    const unsubscribeLeads = subscribeUserLeads(user.uid, (cloudLeads) => {
      if (cloudLeads && cloudLeads.length > 0) {
        setLeads(cloudLeads.map(normalizeLead));
      }
    });

    // 2. Subscribe to User Settings
    const unsubscribeSettings = subscribeUserSettings(user.uid, (cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    });

    // 3. Subscribe to User Notifications
    const unsubscribeNotifs = subscribeUserNotifications(user.uid, (cloudNotifs) => {
      if (cloudNotifs && cloudNotifs.length > 0) {
        setNotifications(cloudNotifs);
      }
    });

    // 4. Subscribe to User Agent Tasks
    const unsubscribeTasks = subscribeUserTasks(user.uid, (cloudTasks) => {
      if (cloudTasks && cloudTasks.length > 0) {
        setAgentTasks(cloudTasks);
      }
    });

    return () => {
      unsubscribeLeads();
      unsubscribeSettings();
      unsubscribeNotifs();
      unsubscribeTasks();
    };
  }, [user]);

  // Update Lead Status Handler
  const handleUpdateStatus = async (leadId: string, newStatus: PipelineStatus) => {
    try {
      const existing = leads.find((l) => l.id === leadId);
      if (existing && user) {
        const merged = { ...existing, status: newStatus, updatedAt: new Date().toISOString() };
        saveUserLead(user.uid, merged).catch(console.error);
      }

      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Update Lead Partial Updates
  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const existing = leads.find((l) => l.id === leadId);
      if (existing && user) {
        const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        saveUserLead(user.uid, merged).catch(console.error);
      }

      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updates } : l)));
      if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, ...updates });
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  };

  // Quick WhatsApp Launcher
  const handleQuickWhatsApp = (lead: Lead) => {
    const rawPhone = (lead.phone || '').replace(/[^0-9]/g, '');
    const message =
      lead.generatedMessage ||
      `Hi ${lead.businessName}, noticed your website presence in ${lead.city} has high growth potential. I prepared a mobile design preview for you. Would you like me to share it?`;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${rawPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Generate Outreach via AI
  const handleGenerateOutreach = async (lead: Lead) => {
    const res = await apiFetch('/api/messages/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, settings }),
    });
    if (res.ok) {
      const data = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? data.lead : l)));
      setSelectedLead(data.lead);
      if (user) {
        saveUserLead(user.uid, data.lead).catch(console.error);
      }
    }
  };

  // Record Sent Outreach
  const handleSendOutreach = async (leadId: string, channel: string, message: string, stepIndex: number) => {
    const res = await apiFetch('/api/outreach/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: leads.find((l) => l.id === leadId), settings, analytics, channel, messageText: message, stepIndex }),
    });
    if (res.ok) {
      const data = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
      if (selectedLead?.id === leadId) {
        setSelectedLead(data.lead);
      }
      if (user) {
        saveUserLead(user.uid, data.lead).catch(console.error);
      }
      fetchAllData();
    }
  };

  // Generate Proposal
  const handleGenerateProposal = async (
    lead: Lead,
    tier: 'STARTER' | 'PROFESSIONAL' | 'PREMIUM' = 'PROFESSIONAL',
    priceOverride?: number
  ) => {
    const res = await apiFetch('/api/proposals/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, settings, tier, priceOverride }),
    });
    if (res.ok) {
      const data = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? data.lead : l)));
      setSelectedLead(data.lead);
      if (user) {
        saveUserLead(user.uid, data.lead).catch(console.error);
      }
      fetchAllData();
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    if (user) {
      await saveUserSettings(user.uid, newSettings).catch(console.error);
    }
    setSettings((current) => (current ? { ...current, ...newSettings } : current));
  };

  // Agent Controls
  const handleControlAgent = async (action: 'START' | 'PAUSE' | 'STOP') => {
    const res = await apiFetch('/api/agent/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      setAgentStatus(data.status);
      setAgentTasks(data.tasks || []);
    }
  };

  const handleRunCycle = async () => {
    try {
      const res = await apiFetch('/api/agent/run-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, settings }),
      });
      const data = await res.json();
      if (data.success && data.updatedLeads) {
        setLeads((prev) => {
          const newLeads = [...prev];
          data.updatedLeads.forEach((ul: any) => {
            const idx = newLeads.findIndex((l) => l.id === ul.id);
            if (idx >= 0) newLeads[idx] = ul;
            if (user) saveUserLead(user.uid, ul).catch(console.error);
          });
          return newLeads;
        });
        setActiveTab('discover');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Discovered Leads Callback
  const handleLeadsDiscovered = (newLeads: Lead[]) => {
    const safeLeads = newLeads.map(normalizeLead);
    setLeads((prev) => [...safeLeads, ...prev.filter((p) => !safeLeads.some((n) => n.id === p.id))]);
    if (user) {
      for (const l of safeLeads) {
        saveUserLead(user.uid, l).catch(console.error);
      }
    }
    fetchAllData();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        agentStatus={agentStatus}
        onToggleAgent={() => handleControlAgent(agentStatus === 'RUNNING' ? 'PAUSE' : 'START')}
        notifications={notifications}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenKeyPool={() => setShowApiKeyPool(true)}
        keyPoolCount={keyPoolCount}
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'signin');
          setShowAuthModal(true);
        }}
        darkMode={darkMode}
        setDarkMode={handleToggleDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
            <p className="text-sm font-medium">Initializing WebLead AI Engine...</p>
          </div>
        ) : (
          <>
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <DashboardView
                analytics={analytics}
                leads={leads}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onNavigateToDiscover={() => setActiveTab('discover')}
                onNavigateToCRM={() => setActiveTab('crm-table')}
              />
            )}

            {/* DISCOVER BUSINESSES TAB */}
            {activeTab === 'discover' && (
              <DiscoveryEngine settings={settings}
                onLeadsDiscovered={handleLeadsDiscovered}
                onSelectLead={(lead) => setSelectedLead(lead)}
              />
            )}

            {/* CRM TABLE TAB */}
            {activeTab === 'crm-table' && (
              <LeadTableView
                leads={leads}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onUpdateStatus={handleUpdateStatus}
                onQuickWhatsApp={handleQuickWhatsApp}
                onQuickGenerateProposal={(lead) => handleGenerateProposal(lead)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {/* CRM KANBAN TAB */}
            {activeTab === 'crm-kanban' && (
              <KanbanBoardView
                leads={leads}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onUpdateStatus={handleUpdateStatus}
                onQuickWhatsApp={handleQuickWhatsApp}
              />
            )}

            {/* AGENT CONTROL CENTER TAB */}
            {activeTab === 'agent' && (
              <AgentControlCenter
                status={agentStatus}
                tasks={agentTasks}
                settings={settings}
                onControlAgent={handleControlAgent}
                onTriggerDiscoveryTask={() => setActiveTab('discover')}
                onRunCycle={handleRunCycle}
              />
            )}

            {/* SETTINGS & PROFILE TAB */}
            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onOpenKeyPool={() => setShowApiKeyPool(true)}
                onOpenAuth={(mode) => {
                  setAuthMode(mode || 'signin');
                  setShowAuthModal(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Lead Detail Inspection Drawer with Backdrop */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLead(null)}
          />
          <LeadDetailDrawer settings={settings}
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdateLead={handleUpdateLead}
            onGenerateOutreach={handleGenerateOutreach}
            onSendOutreach={handleSendOutreach}
            onGenerateProposal={handleGenerateProposal}
          />
        </div>
      )}

      {/* Notifications Popover */}
      <NotificationsPopover
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkRead={async (id) => {
          await apiFetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'MARK_READ', id }),
          });
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        }}
        onMarkAllRead={async () => {
          await apiFetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'MARK_ALL_READ' }),
          });
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleSaveSettings}
        onRunFirstDiscovery={(category, city) => {
          setActiveTab('discover');
        }}
      />

      {/* Gemini API Key Pool & Auto-Rotation Modal */}
      <ApiKeyPoolModal
        isOpen={showApiKeyPool}
        onClose={() => setShowApiKeyPool(false)}
        onKeysUpdated={fetchAllData}
      />

      {/* Firebase Multi-User Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
}
