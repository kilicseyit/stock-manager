'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import {
  Activity,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  CheckCircle,
  Eye,
  X,
} from 'lucide-react';

export default function AktiviteLogPage() {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
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
      refetchInterval: 30000, // 30 seconds refetch
      refetchOnWindowFocus: true,
    }
  );

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
            Sistem genelinde gerçekleştirilen tüm envanter hareketleri, kullanıcı düzenlemeleri ve log kayıtları. (30s Otomatik Güncelleme)
          </p>
        </div>
        <div>
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

      {/* Logs Table */}
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
