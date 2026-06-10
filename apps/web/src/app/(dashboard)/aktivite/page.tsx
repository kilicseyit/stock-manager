'use client';

import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '@/trpc/client';
import {
  Activity,
  User,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
  Eye,
  X,
  LayoutList,
  Rss,
  Plus,
  Pencil,
  Trash2,
  Settings,
  Zap,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const actionFeedConfig: Record<string, { icon: React.ElementType; color: string; dotColor: string; label: string }> = {
  CREATE:           { icon: Plus,     color: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500', label: 'Oluşturuldu' },
  UPDATE:           { icon: Pencil,   color: 'text-blue-600 dark:text-blue-400',       dotColor: 'bg-blue-500',    label: 'Güncellendi' },
  DELETE:           { icon: Trash2,   color: 'text-rose-600 dark:text-rose-400',       dotColor: 'bg-rose-500',    label: 'Silindi'     },
  STOCK_ADJUSTMENT: { icon: Settings, color: 'text-amber-600 dark:text-amber-400',     dotColor: 'bg-amber-500',   label: 'Stok Ayarı'  },
  ADJUSTMENT:       { icon: Settings, color: 'text-amber-600 dark:text-amber-400',     dotColor: 'bg-amber-500',   label: 'Düzeltme'    },
};

function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)   return `${seconds}s önce`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}dk önce`;
  if (seconds < 86400)return `${Math.floor(seconds / 3600)}sa önce`;
  return new Date(date).toLocaleDateString('tr-TR');
}

export default function AktiviteLogPage() {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'feed'>('feed');
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  // Modal for viewing JSON details
  const [selectedLogJson, setSelectedLogJson] = useState<any>(null);

  // Queries
  const usersQuery = trpc.user.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const auditLogsQuery = trpc.user.getAuditLogs.useQuery(
    {
      userId: selectedUser || null,
      action: selectedAction || null,
      startDate: startDate || null,
      endDate: endDate || null,
    },
    {
      refetchInterval: viewMode === 'feed' ? 10000 : 30000,
      refetchOnWindowFocus: true,
    }
  );

  // Detect newly arrived log entries and mark them for 4s pulse highlight
  useEffect(() => {
    const logs: any[] = auditLogsQuery.data ?? [];
    const currentIds = new Set(logs.map((l: any) => l.id as string));
    const fresh = [...currentIds].filter((id) => !prevIdsRef.current.has(id));
    if (fresh.length > 0 && prevIdsRef.current.size > 0) {
      setNewIds(new Set(fresh));
      const t = setTimeout(() => setNewIds(new Set()), 4000);
      return () => clearTimeout(t);
    }
    prevIdsRef.current = currentIds;
  }, [auditLogsQuery.data]);

  const handleResetFilters = () => {
    setSelectedUser('');
    setSelectedAction('');
    setStartDate('');
    setEndDate('');
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
      case 'DELETE':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30';
      case 'STOCK_ADJUSTMENT':
      case 'ADJUSTMENT':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
      default:
        return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-8 h-8 text-indigo-650" />
            Aktivite Logları
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Sistem genelinde gerçekleştirilen tüm envanter hareketleri ve düzenlemeler.{' '}
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {viewMode === 'feed' ? '10s' : '30s'} otomatik güncelleme
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'feed'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <Rss className="w-3.5 h-3.5" />
              Akış
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Tablo
            </button>
          </div>
          <button
            onClick={() => auditLogsQuery.refetch()}
            disabled={auditLogsQuery.isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditLogsQuery.isFetching ? 'animate-spin' : ''}`} />
            {auditLogsQuery.isFetching ? 'Tazeleniyor...' : 'Tazele'}
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="p-5 bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-450 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-indigo-500" />
          Log Filtreleme Paneli
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* User Filter */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" /> İşlemi Yapan Kullanıcı
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-250 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-850 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Tüm Kullanıcılar</option>
              {usersQuery.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5">
              İşlem Tipi / Aksiyon
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-250 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-850 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Tüm Aksiyonlar</option>
              <option value="CREATE">CREATE (Oluşturma)</option>
              <option value="UPDATE">UPDATE (Güncelleme)</option>
              <option value="DELETE">DELETE (Silme)</option>
              <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT (Stok Ayarı)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Düzeltme)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-250 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-850 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-250 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-850 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent transition-all cursor-pointer"
          >
            Filtreleri Temizle
          </button>
        </div>
      </div>

      {/* Feed View */}
      {viewMode === 'feed' && (
        <div className="space-y-0">
          {auditLogsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !auditLogsQuery.data?.length ? (
            <EmptyState variant="activity" title="Aktivite Bulunamadı" description="Seçili filtreler için kayıtlı log girişi yok." />
          ) : (
            <div className="relative">
              {/* vertical spine */}
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-1">
                {(auditLogsQuery.data as any[]).map((log: any, idx: number) => {
                  const cfg = actionFeedConfig[log.action as string] ?? actionFeedConfig.UPDATE;
                  const Icon = cfg.icon;
                  const isNew = newIds.has(log.id);
                  return (
                    <div
                      key={log.id}
                      className={`relative flex gap-4 px-2 py-3 rounded-2xl transition-all duration-500 ${
                        isNew ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                      }`}
                    >
                      {/* Dot + Icon */}
                      <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 ${
                        isNew
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        {isNew && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {log.user?.name || 'Sistem'}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : log.action === 'DELETE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                            {log.entity}
                          </span>
                          {isNew && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" /> YENİ
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {timeAgo(log.createdAt)}
                          </span>
                          {log.entityId && (
                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 truncate max-w-[120px]">
                              #{log.entityId.slice(-8)}
                            </span>
                          )}
                          {log.newValue && (
                            <button
                              onClick={() => setSelectedLogJson(log)}
                              className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Detay
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 shrink-0 pt-1 hidden sm:block">
                        {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      {viewMode === 'table' && (
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-sm">
        {auditLogsQuery.isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : !auditLogsQuery.data?.length ? (
          <div className="py-20 text-center text-zinc-400">
            Filtrelere uygun aktivite logu bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-650 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">Tarih / Saat</th>
                  <th className="px-6 py-4">İşlemi Yapan</th>
                  <th className="px-6 py-4">Aksiyon</th>
                  <th className="px-6 py-4">Etkilenen Nesne (Entity)</th>
                  <th className="px-6 py-4">Nesne ID</th>
                  <th className="px-6 py-4 text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {(auditLogsQuery.data as any[])?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-50">
                          {log.user?.name || 'Sistem / Bilinmeyen'}
                        </div>
                        <div className="text-xs text-zinc-450 font-mono">{log.user?.email || 'system'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-indigo-650 dark:text-indigo-400">
                        {log.entity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-450 max-w-[120px] truncate">
                      {log.entityId}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.newValue ? (
                        <button
                          onClick={() => setSelectedLogJson(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-650 dark:text-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Göster
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* JSON Viewer Modal */}
      {selectedLogJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLogJson(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-500" />
                İşlem Değişiklik Detayları
              </h2>
              <button
                onClick={() => setSelectedLogJson(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Entity: </span>
                {selectedLogJson.entity} ({selectedLogJson.entityId})
              </div>
              <pre className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 font-mono text-[11px] leading-relaxed text-indigo-650 dark:text-indigo-400 overflow-auto max-h-[300px] border border-zinc-200 dark:border-zinc-800">
                {JSON.stringify(selectedLogJson.newValue, null, 2)}
              </pre>
            </div>
            
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-150 dark:border-zinc-850 flex justify-end">
              <button
                onClick={() => setSelectedLogJson(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-250 hover:bg-zinc-100 text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
