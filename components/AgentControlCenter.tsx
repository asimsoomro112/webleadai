'use client';

import React from 'react';
import {
  Bot,
  Play,
  Pause,
  Square,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AgentTask, AppSettings } from '@/lib/types';

interface AgentControlCenterProps {
  status: 'IDLE' | 'RUNNING' | 'PAUSED';
  tasks: AgentTask[];
  settings: AppSettings | null;
  onControlAgent: (action: 'START' | 'PAUSE' | 'STOP') => void;
  onTriggerDiscoveryTask: () => void;
  onRunCycle?: () => void;
}

export function AgentControlCenter({
  status,
  tasks,
  settings,
  onControlAgent,
  onTriggerDiscoveryTask,
  onRunCycle,
}: AgentControlCenterProps) {
  const completedTasks = tasks.filter((t) => t.status === 'SUCCESS').length;
  const runningTasks = tasks.filter((t) => t.status === 'RUNNING').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Autonomous Agent Control Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Manage background discovery workers, task execution queues, and ethical compliance guardrails.
          </p>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center gap-2">
          {status === 'RUNNING' ? (
            <button
              onClick={() => onControlAgent('PAUSE')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Autonomous Agent</span>
            </button>
          ) : (
            <button
              onClick={() => onControlAgent('START')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Start Autonomous Agent</span>
            </button>
          )}

          <button
            onClick={() => onControlAgent('STOP')}
            className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop / Reset</span>
          </button>
        </div>
      </div>

      {/* Agent Status Banner */}
      <div
        id="agent-master-status-card"
        className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
              status === 'RUNNING'
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                : status === 'PAUSED'
                ? 'bg-amber-500'
                : 'bg-zinc-500'
            }`}
          >
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Agent Status: {status}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  status === 'RUNNING'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {status === 'RUNNING' ? 'Active Scanning & Scoring' : 'Idle / Standby'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Autonomous search worker runs with safety rate limits (Max {settings?.dailyOutreachLimit || 15} outreach/day).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-center">
          <div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {tasks.length}
            </div>
            <span className="text-[11px] text-zinc-400">Total Jobs</span>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>
          <div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedTasks}
            </div>
            <span className="text-[11px] text-zinc-400">Completed</span>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>
          <div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {runningTasks}
            </div>
            <span className="text-[11px] text-zinc-400">In Progress</span>
          </div>
        </div>
      </div>

      {/* Safety & Compliance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Anti-Spam Rate Limiting</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Strict maximum of 15 contacts per day to protect domain and phone reputation while ensuring high touch personalization.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
            <Activity className="w-4 h-4" />
            <span>Human-in-the-Loop Gate</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            All AI-drafted messages require one-click developer review before dispatching via WhatsApp or Email.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Lead Deduplication</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Automatic filtering against previously contacted business phone numbers, domains, and Google Place IDs.
          </p>
        </div>
      </div>

      {/* Task Queue Log */}
      <div
        id="agent-task-queue-section"
        className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Agent Background Tasks Queue
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Real-time monitoring of scraping, deep audit calculations, and message drafting jobs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onRunCycle) {
                  onRunCycle();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Autonomous Optimization Cycle</span>
            </button>
            <button
              onClick={onTriggerDiscoveryTask}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run Quick Task</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs">
              No tasks in the queue. Start the agent to initiate background tasks.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {task.type}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {task.description}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : task.status === 'RUNNING'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
