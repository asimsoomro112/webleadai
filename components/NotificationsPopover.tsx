'use client';

import React from 'react';
import { X, CheckCircle2, Bell, Sparkles, MessageSquare } from 'lucide-react';
import { AppNotification } from '@/lib/types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationsPopover({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationsPopoverProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/30 backdrop-blur-xs">
      <div
        id="notifications-popover"
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden mt-14 mr-2 animate-in slide-in-from-top-2 duration-200"
      >
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
              Pipeline Alerts
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-zinc-400">
              No recent notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`p-3.5 space-y-1 cursor-pointer transition-colors ${
                  n.read ? 'opacity-60 bg-transparent' : 'bg-emerald-50/40 dark:bg-emerald-950/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {n.title}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-tight">
                  {n.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
