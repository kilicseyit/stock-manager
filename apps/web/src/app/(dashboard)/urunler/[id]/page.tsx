'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import {
  Package,
  ArrowLeft,
  MapPin,
  Tag,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Wrench,
  Edit,
  QrCode,
  History,
  Calendar,
  Layers,
} from 'lucide-react';
import ProductFormModal from '@/components/features/products/ProductFormModal';
import QrCodeModal from '@/components/features/products/QrCodeModal';
import ProductHistoryModal from '@/components/features/products/ProductHistoryModal';

const movementIcons = {
  IN:         { Icon: ArrowDownToLine, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', label: 'Giriş'    },
  OUT:        { Icon: ArrowUpFromLine, color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-100 dark:bg-rose-900/40',       label: 'Çıkış'    },
  TRANSFER:   { Icon: ArrowLeftRight,  color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/40',       label: 'Transfer' },
  ADJUSTMENT: { Icon: Wrench,          color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-900/40',     label: 'Düzeltme' },
} as const;

export default function ProductDetailPage() {
  const params = useParams()!;
  const id = (params?.id ?? '') as string;
  const router = useRouter();
  const utils = trpc.useUtils();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const productQuery = trpc.product.getById.useQuery({ id });
  const historyQuery = trpc.inventory.getHistory.useQuery({ limit: 10 });
  const categoriesQuery = trpc.category.getAll.useQuery();

  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.getById.invalidate({ id });
      setIsFormOpen(false);
    },
  });

  const product = productQuery.data;
  if (productQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <Package className="w-16 h-16 text-zinc-300 dark:text-zinc-700" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Ürün Bulunamadı</h2>
        <button onClick={() => router.back()} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Geri Dön
        </button>
      </div>
    );
  }

  const totalStock = product.stockItems.reduce((s, i) => s + i.quantity, 0);
  const reservedQty = product.stockItems.reduce((s, i) => s + ((i as any).reservedQty || 0), 0);
  const availableQty = totalStock - reservedQty;
  const isOutOfStock = totalStock === 0;
  const isLowStock = !isOutOfStock && totalStock <= product.minStock;
  const cap = product.maxStock ?? Math.max(product.minStock * 4, totalStock * 1.5, 1);
  const stockPct = Math.min(100, Math.round((totalStock / cap) * 100));

  const recentMovements = historyQuery.data?.items.filter(
    (m) => m.product.id === id
  ) ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
              <span className="hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/urunler')}>
                Ürün Kataloğu
              </span>
              <span>/</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">{product.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{product.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <History className="w-4 h-4" />
            Geçmiş
          </button>
          <button
            onClick={() => setShowQr(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <QrCode className="w-4 h-4" />
            QR Kod
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/20"
          >
            <Edit className="w-4 h-4" />
            Düzenle
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Image */}
        <div className="w-full md:w-40 h-40 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-16 h-16 text-zinc-300 dark:text-zinc-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
              {product.sku}
            </span>
            {product.barcode && (
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Barkod: {product.barcode}
              </span>
            )}
            {product.category && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                <Tag className="w-3 h-3" />
                {product.category.name}
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                Stok Yok
              </span>
            )}
            {isLowStock && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                Düşük Stok
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Birim</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{product.unit}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Min Stok</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{product.minStock}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Max Stok</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{product.maxStock ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Kayıt Tarihi</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {new Date(product.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>

          {/* Stock Progress */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
              <span className="font-medium">Stok Doluluk Oranı</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">{stockPct}%</span>
            </div>
            <div className="relative h-2 rounded-full bg-zinc-200 dark:bg-zinc-700/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${stockPct}%` }}
              />
              {product.minStock > 0 && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-zinc-400/50"
                  style={{ left: `${Math.min(100, Math.round((product.minStock / cap) * 100))}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>0</span>
              <span>Min: {product.minStock}</span>
              {product.maxStock && <span>Max: {product.maxStock}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Stok',    value: totalStock,    icon: Layers,       color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-950/30'  },
          { label: 'Serbest',        value: availableQty,  icon: TrendingUp,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30'},
          { label: 'Rezerve',        value: reservedQty,   icon: TrendingDown, color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/30'    },
          { label: 'Lokasyon Sayısı',value: product.stockItems.length, icon: MapPin, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30'      },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lokasyonlar + Son Hareketler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lokasyonlar */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Lokasyon Dağılımı</h3>
          </div>
          {product.stockItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-600">
              Bu ürün henüz hiçbir lokasyona stoklanmamış.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {product.stockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.location.zone}
                        {item.location.aisle ? ` / ${item.location.aisle}` : ''}
                        {item.location.shelf ? ` / ${item.location.shelf}` : ''}
                        {item.location.bin   ? ` / ${item.location.bin}`   : ''}
                      </p>
                      {item.location.warehouse?.name && (
                        <p className="text-xs text-zinc-400">{item.location.warehouse.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{item.quantity}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">adet</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Son Hareketler */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Son Hareketler</h3>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Tümünü Gör
            </button>
          </div>
          {recentMovements.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-600">
              Bu ürün için hareket kaydı bulunamadı.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {recentMovements.slice(0, 8).map((m) => {
                const cfg = movementIcons[m.type as keyof typeof movementIcons] ?? movementIcons.IN;
                const { Icon } = cfg;
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{cfg.label}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(m.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${m.type === 'OUT' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {m.type === 'OUT' ? '-' : '+'}{m.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isFormOpen && (
        <ProductFormModal
          isOpen
          mode="edit"
          categories={categoriesQuery.data ?? []}
          defaultValues={{
            id: product.id,
            name: product.name,
            categoryId: product.categoryId ?? '',
            unit: product.unit,
            barcode: product.barcode ?? '',
            minStock: product.minStock,
            maxStock: product.maxStock ?? undefined,
            imageUrl: product.imageUrl ?? '',
          }}
          isLoading={updateProduct.isPending}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(data) => updateProduct.mutate({ id: product.id, ...data })}
        />
      )}

      <QrCodeModal
        product={showQr ? { id: product.id, name: product.name, sku: product.sku, barcode: product.barcode } as any : null}
        onClose={() => setShowQr(false)}
      />

      <ProductHistoryModal
        isOpen={showHistory}
        productId={product.id}
        productName={product.name}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
