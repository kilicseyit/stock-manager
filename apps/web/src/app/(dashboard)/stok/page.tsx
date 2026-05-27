'use client';

import React, { useState, useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { useSocket } from '@/hooks/useSocket';
import StockMovementForm from '@/components/features/inventory/StockMovementForm';
import StockGrid from '@/components/features/inventory/StockGrid';
import {
  Plus,
  History,
  LayoutGrid,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Wrench,
  Package,
  AlertTriangle,
  Activity,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

const movementTypeLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  IN: { label: 'Giriş', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50', icon: ArrowDownToLine },
  OUT: { label: 'Çıkış', color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50', icon: ArrowUpFromLine },
  TRANSFER: { label: 'Transfer', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50', icon: ArrowLeftRight },
  ADJUSTMENT: { label: 'Düzeltme', color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50', icon: Wrench },
};

type TabView = 'grid' | 'history';

export default function StokPage() {
  const [tab, setTab] = useState<TabView>('grid');
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Socket.io — real-time updates
  const { joinInventory, leaveInventory, onInventoryUpdate } = useSocket();

  // tRPC queries
  const utils = trpc.useUtils();

  const statsQuery = trpc.inventory.getDashboardStats.useQuery();
  const stockQuery = trpc.inventory.getStock.useQuery({});
  const historyQuery = trpc.inventory.getHistory.useQuery({
    limit: 20,
    type: typeFilter ? (typeFilter as 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT') : undefined,
  });
  const productsQuery = trpc.product.getAll.useQuery({ limit: 100 });
  const locationsQuery = trpc.location.getAll.useQuery();

  const createMovement = trpc.inventory.create.useMutation({
    onSuccess: () => {
      utils.inventory.getStock.invalidate();
      utils.inventory.getHistory.invalidate();
      utils.inventory.getDashboardStats.invalidate();
      setShowForm(false);
    },
  });

  // Socket.io lifecycle
  useEffect(() => {
    joinInventory();
    return () => leaveInventory();
  }, [joinInventory, leaveInventory]);

  // Socket.io real-time event listener
  useEffect(() => {
    const unsubscribe = onInventoryUpdate(() => {
      // Stok verileri değiştiğinde refetch
      utils.inventory.getStock.invalidate();
      utils.inventory.getHistory.invalidate();
      utils.inventory.getDashboardStats.invalidate();
    });
    return unsubscribe;
  }, [onInventoryUpdate, utils]);

  const stats = statsQuery.data;
  const products = productsQuery.data?.items ?? [];
  const locations = locationsQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Stok Yönetimi
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gerçek zamanlı stok takibi ve hareket yönetimi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              utils.inventory.getStock.invalidate();
              utils.inventory.getHistory.invalidate();
              utils.inventory.getDashboardStats.invalidate();
            }}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Stok Hareketi
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Toplam Ürün */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats?.totalProducts ?? '—'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Toplam Ürün</p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10" />
        </div>

        {/* Toplam Hareket */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats?.totalMovements ?? '—'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Toplam Hareket</p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10" />
        </div>

        {/* Düşük Stok */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats?.lowStockCount ?? '—'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Düşük Stok Uyarısı</p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-red-500/5 dark:bg-red-500/10" />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
        <button
          onClick={() => setTab('grid')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'grid'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Stok Durumu
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'history'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <History className="w-4 h-4" />
          Hareket Geçmişi
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'grid' && (
        <StockGrid
          items={stockQuery.data ?? []}
          isLoading={stockQuery.isLoading}
        />
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          {/* Filtre */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="">Tüm Hareketler</option>
                <option value="IN">Giriş</option>
                <option value="OUT">Çıkış</option>
                <option value="TRANSFER">Transfer</option>
                <option value="ADJUSTMENT">Düzeltme</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Hareket Tablosu */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {historyQuery.isLoading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                ))}
              </div>
            ) : !historyQuery.data?.items.length ? (
              <div className="text-center py-16">
                <History className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Henüz stok hareketi kaydı yok.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tip</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ürün</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kaynak</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Hedef</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Miktar</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {historyQuery.data.items.map((m) => {
                      const typeInfo = movementTypeLabels[m.type] ?? movementTypeLabels.IN;
                      const TypeIcon = typeInfo.icon;
                      return (
                        <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">{m.product.name}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.product.sku}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                            {m.fromLocation
                              ? `${m.fromLocation.zone}${m.fromLocation.aisle ? ` / ${m.fromLocation.aisle}` : ''}`
                              : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                            {m.toLocation
                              ? `${m.toLocation.zone}${m.toLocation.aisle ? ` / ${m.toLocation.aisle}` : ''}`
                              : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {m.type === 'OUT' ? '-' : '+'}{m.quantity}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Daha Fazla */}
            {historyQuery.data?.nextCursor && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <button
                  onClick={() => {
                    // TODO: Cursor-based load more
                  }}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all"
                >
                  Daha Fazla Yükle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Movement Form Modal */}
      {showForm && (
        <StockMovementForm
          products={products.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))}
          locations={locations.map((l) => ({
            id: l.id,
            zone: l.zone,
            aisle: l.aisle,
            shelf: l.shelf,
            warehouse: l.warehouse,
          }))}
          isLoading={createMovement.isPending}
          onSubmit={(data) => {
            createMovement.mutate({
              type: data.type,
              productId: data.productId,
              fromLocationId: data.fromLocationId || undefined,
              toLocationId: data.toLocationId || undefined,
              quantity: data.quantity,
              reason: data.reason || undefined,
            });
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
