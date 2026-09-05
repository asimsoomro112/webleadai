'use client';

import React from 'react';
import {
  Bot,
  Search,
  Sliders,
  Sparkles,
  Layers,
  Kanban,
  FileText,
  Settings,
  Bell,
  Play,
  Pause,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Key,
  LogIn,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { AppNotification } from '@/lib/types';
import { useAuth } from '@/lib/authContext';

interface NavbarProps {
  activeTab: 'dashboard' | 'discover' | 'crm-table' | 'crm-kanban' | 'agent' | 'proposals' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'discover' | 'crm-table' | 'crm-kanban' | 'agent' | 'proposals' | 'settings') => void;
  agentStatus: 'IDLE' | 'RUNNING' | 'PAUSED';
  onToggleAgent: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenOnboarding: () => void;
  onOpenKeyPool?: () => void;
  keyPoolCount?: number;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  agentStatus,
  onToggleAgent,
  notifications,
  onOpenNotifications,
  onOpenOnboarding,
  onOpenKeyPool,
  keyPoolCount = 1,
  onOpenAuth,
  darkMode,
  setDarkMode,
  searchQuery,
  setSearchQuery,
}: NavbarProps) {
  const { user, userProfile, signOutUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Status */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                    WebLead<span className="text-emerald-600 dark:text-emerald-400">AI</span>
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Autonomous
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                  Client Acquisition SaaS
                </p>
              </div>
            </button>

            {/* Agent Live Pill */}
            <div
              id="agent-status-pill"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
            >
              <span className="relative flex h-2.5 w-2.5">
                {agentStatus === 'RUNNING' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    agentStatus === 'RUNNING'
                      ? 'bg-emerald-500'
                      : agentStatus === 'PAUSED'
                      ? 'bg-amber-500'
                      : 'bg-zinc-400'
                  }`}
                ></span>
              </span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Agent: <span className="font-semibold">{agentStatus}</span>
              </span>
              <button
                id="toggle-agent-quick-btn"
                onClick={onToggleAgent}
                title={agentStatus === 'RUNNING' ? 'Pause Agent' : 'Start Agent'}
                className="ml-1 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-600 dark:text-zinc-400"
              >
                {agentStatus === 'RUNNING' ? (
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex flex-1 max-w-xs items-center relative">
            <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search leads, cities, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Key Pool Trigger button */}
            {onOpenKeyPool && (
              <button
                id="api-key-pool-navbar-btn"
                onClick={onOpenKeyPool}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors"
                title="Gemini API Key Pool & Auto-Rotation on Quota"
              >
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline">API Keys</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {keyPoolCount}
                </span>
              </button>
            )}

            {/* Onboarding Wizard button */}
            <button
              id="wizard-trigger-btn"
              onClick={onOpenOnboarding}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Guide Wizard</span>
            </button>

            {/* Notifications */}
            <button
              id="notifications-toggle-btn"
              onClick={onOpenNotifications}
              className="relative p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="dark-mode-toggle-btn"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            {/* Authentication & User Profile Pill */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 text-xs font-semibold rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-all cursor-pointer"
                  title={`Signed in as ${user.email}`}
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                    {userProfile?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {userProfile?.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-70" />
                </button>

                {showUserMenu && (
                  <div
                    id="user-profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-64 p-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 space-y-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {userProfile?.displayName || 'Agency Owner'}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {user.email}
                      </p>
                      {userProfile?.businessName && (
                        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
                          {userProfile.businessName}
                        </p>
                      )}
                      <div className="pt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Firestore Isolated Cloud Sync</span>
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Account & Keys Settings</span>
                      </button>

                      {onOpenKeyPool && (
                        <button
                          onClick={() => {
                            onOpenKeyPool();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left"
                        >
                          <Key className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Gemini API Key Pool</span>
                        </button>
                      )}

                      <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

                      <button
                        onClick={() => {
                          signOutUser();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="navbar-signin-btn"
                onClick={() => onOpenAuth?.('signin')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Sign Up</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav
          id="main-navigation-tabs"
          className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-2 -mb-px border-t border-zinc-100 dark:border-zinc-900 text-xs font-medium"
        >
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-tab-discover"
            onClick={() => setActiveTab('discover')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'discover'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover Businesses</span>
          </button>

          <button
            id="nav-tab-crm-table"
            onClick={() => setActiveTab('crm-table')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'crm-table'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Lead CRM Table</span>
          </button>

          <button
            id="nav-tab-crm-kanban"
            onClick={() => setActiveTab('crm-kanban')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'crm-kanban'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline Kanban</span>
          </button>

          <button
            id="nav-tab-agent"
            onClick={() => setActiveTab('agent')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'agent'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Agent Control Center</span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Profile</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
