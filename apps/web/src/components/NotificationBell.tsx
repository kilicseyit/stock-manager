'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Package, Info, X } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

/** date-fns v4 + TypeScript derinlik soruşuna karşı sarıcı */
function timeAgo(date: string | Date): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (formatDistanceToNow as any)(new Date(date), { addSuffix: true, locale: tr });
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  LOW_STOCK: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  PRODUCT: {
    icon: Package,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/40',
  },
  INFO: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
  },
};

function getTypeConfig(type: string) {
  return typeConfig[type] ?? typeConfig.INFO;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const utils = trpc.useUtils();

  // Okunmamış sayı — 30 saniye polling
  const { data: unreadData } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  // Bildirim listesi — panel açıkken aktif
  const { data: notifData, isLoading } = trpc.notification.getAll.useQuery(
    { limit: 20 },
    { enabled: open, refetchInterval: open ? 30_000 : false }
  );

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notifData?.items ?? [];

  // Panel dışına tıklayınca kapat
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClickOutside]);

  return (
    <div className="relative">
      {/* Zil Butonu */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors relative"
        aria-label="Bildirimler"
        id="notification-bell-btn"
      >
        <Bell className={`w-5 h-5 ${open ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-zinc-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-96 max-h-[520px] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          id="notification-panel"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                Bildirimler
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate(undefined)}
                  disabled={markAllAsRead.isPending}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all disabled:opacity-50"
                  title="Tümünü okundu işaretle"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tümünü Oku
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bildirim Listesi */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Bell className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Bildirim yok
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Yeni bildirimler burada görünecek.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {(notifications as Array<{ id: string; type: string; title: string; body: string; isRead: boolean; createdAt: unknown }>).map((n) => {
                  const cfg = getTypeConfig(n.type);
                  const Icon = cfg.icon;
                  return (
                    <li
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${
                        !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''
                      }`}
                    >
                      {/* İkon */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>

                      {/* İçerik */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${!n.isRead ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                          {timeAgo(n.createdAt as string | Date)}
                        </p>
                      </div>

                      {/* Okundu işareti */}
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead.mutate({ id: n.id })}
                          className="flex-shrink-0 p-1 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                          title="Okundu işaretle"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
