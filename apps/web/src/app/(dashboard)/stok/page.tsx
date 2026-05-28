'use client';

import React, { useState, useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { useInventoryBroadcast } from '@/hooks/useInventoryBroadcast';
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
  RefreshCw,
  Upload,
  Search,
  X,
} from 'lucide-react';
import StockMovementImportModal from '@/components/features/inventory/StockMovementImportModal';

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Stock grid filters (client-side)
  const [stockSearch, setStockSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');

  // History search (client-side)
  const [historySearch, setHistorySearch] = useState('');

  // BroadcastChannel — cross-tab real-time updates
  const { broadcastUpdate, onInventoryUpdate } = useInventoryBroadcast();

  // tRPC queries
  const utils = trpc.useUtils();

  const statsQuery = trpc.inventory.getDashboardStats.useQuery(undefined, {
    refetchInterval: 30000, // 30 saniye fallback polling
  });
  const stockQuery = trpc.inventory.getStock.useQuery({}, {
    refetchInterval: 30000,
  });
  const historyQuery = trpc.inventory.getHistory.useQuery({
    limit: 20,
    type: typeFilter ? (typeFilter as 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT') : undefined,
  }, {
    refetchInterval: 30000,
  });
  const productsQuery = trpc.product.getAll.useQuery({ limit: 100 });
  const locationsQuery = trpc.location.getAll.useQuery();

  const createMovement = trpc.inventory.create.useMutation({
    onSuccess: (data) => {
      // Kendi sayfamızı hemen güncelle
      utils.inventory.getStock.invalidate();
      utils.inventory.getHistory.invalidate();
      utils.inventory.getDashboardStats.invalidate();
      // Diğer sekme/pencerelere bildir
      broadcastUpdate({
        productId: data.productId,
        type: data.type,
      });
      setShowForm(false);
    },
  });

  // BroadcastChannel: başka sekmelerden gelen güncelleme sinyali
  useEffect(() => {
    const unsubscribe = onInventoryUpdate(() => {
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
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-650 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium text-sm transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            Toplu Hareket Yükle
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
        <div className="space-y-4">
          {/* Stock Grid Filters */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Ürün adı veya SKU ile ara..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              {stockSearch && (
                <button onClick={() => setStockSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              {(['all', 'ok', 'low', 'out'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStockStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    stockStatusFilter === s
                      ? s === 'out'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : s === 'low'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : s === 'ok'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {s === 'all' ? 'Tüm Stok' : s === 'ok' ? 'Normal' : s === 'low' ? 'Düşük' : 'Stok Yok'}
                </button>
              ))}
            </div>
          </div>
          <StockGrid
            items={(stockQuery.data ?? []).filter((item) => {
              const nameMatch = !stockSearch ||
                item.product.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                item.product.sku.toLowerCase().includes(stockSearch.toLowerCase());
              const statusMatch =
                stockStatusFilter === 'all' ? true :
                stockStatusFilter === 'out' ? item.quantity === 0 :
                stockStatusFilter === 'low' ? item.quantity > 0 && item.quantity <= item.product.minStock :
                item.quantity > item.product.minStock;
              return nameMatch && statusMatch;
            })}
            isLoading={stockQuery.isLoading}
          />
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          {/* Hareket Geçmişi Filtreleri */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm">
            {/* Ürün Adı / SKU Arama */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Ürün adı veya SKU ile ara..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              {historySearch && (
                <button onClick={() => setHistorySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Hareket Tipi Toggle */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex-wrap">
              {[{ value: '', label: 'Tümü' }, { value: 'IN', label: 'Giriş' }, { value: 'OUT', label: 'Çıkış' }, { value: 'TRANSFER', label: 'Transfer' }, { value: 'ADJUSTMENT', label: 'Düzeltme' }].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === opt.value
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
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
                    {historyQuery.data.items
                      .filter((m) =>
                        !historySearch ||
                        m.product.name.toLowerCase().includes(historySearch.toLowerCase()) ||
                        m.product.sku.toLowerCase().includes(historySearch.toLowerCase())
                      )
                      .map((m) => {
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

      {/* Bulk Stock Movement Import Modal */}
      <StockMovementImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          utils.inventory.getStock.invalidate();
          utils.inventory.getHistory.invalidate();
          utils.inventory.getDashboardStats.invalidate();
        }}
      />
    </div>
  );
}


