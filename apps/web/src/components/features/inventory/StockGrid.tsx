'use client';

import React from 'react';
import { Package, MapPin, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface StockItem {
  id: string;
  quantity: number;
  reservedQty: number;
  product: {
    id: string;
    name: string;
    sku: string;
    minStock: number;
    maxStock: number | null;
    unit: string;
  };
  location: {
    id: string;
    zone: string;
    aisle: string | null;
    shelf: string | null;
    bin: string | null;
    warehouse?: { id: string; name: string };
  };
}

interface StockGridProps {
  items: StockItem[];
  isLoading?: boolean;
}

function getStockStatus(item: StockItem): 'critical' | 'low' | 'normal' | 'over' {
  const { quantity, product } = item;
  if (quantity <= 0) return 'critical';
  if (product.minStock > 0 && quantity <= product.minStock) return 'low';
  if (product.maxStock && quantity > product.maxStock) return 'over';
  return 'normal';
}

const statusConfig = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
    badge: 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300',
    label: 'Kritik',
    icon: AlertTriangle,
  },
  low: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900/50',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    label: 'Düşük',
    icon: TrendingDown,
  },
  normal: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    label: 'Normal',
    icon: TrendingUp,
  },
  over: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-900/50',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    label: 'Fazla',
    icon: TrendingUp,
  },
};

function formatLocation(loc: StockItem['location']): string {
  const parts = [loc.zone];
  if (loc.aisle) parts.push(loc.aisle);
  if (loc.shelf) parts.push(loc.shelf);
  if (loc.bin) parts.push(loc.bin);
  return parts.join(' / ');
}

export default function StockGrid({ items, isLoading }: StockGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Stok Bulunamadı
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Henüz hiçbir lokasyonda stok kaydı yok.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => {
        const status = getStockStatus(item);
        const config = statusConfig[status];
        const StatusIcon = config.icon;
        const availableQty = item.quantity - item.reservedQty;

        return (
          <div
            key={item.id}
            className={`rounded-2xl border p-5 transition-all hover:shadow-md ${config.bg} ${config.border}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {item.product.name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {item.product.sku}
                </p>
              </div>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            </div>

            {/* Lokasyon */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">
                {item.location.warehouse?.name ? `${item.location.warehouse.name} — ` : ''}
                {formatLocation(item.location)}
              </span>
            </div>

            {/* Stok Bilgileri */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {item.quantity}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                  Toplam
                </p>
              </div>
              <div className="text-center border-x border-zinc-200 dark:border-zinc-700/50">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {item.reservedQty}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                  Rezerve
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {availableQty}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                  Serbest
                </p>
              </div>
            </div>

            {/* Min/Max bilgisi */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/30 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Min: {item.product.minStock} {item.product.unit}</span>
              <span>Max: {item.product.maxStock ?? '—'} {item.product.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
