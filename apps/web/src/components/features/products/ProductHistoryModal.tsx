'use client';

import React, { useEffect, useState } from 'react';
import { trpc } from '@/trpc/client';
import {
  X,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Scale,
  User,
  Calendar,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface ProductHistoryModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductHistoryModal({
  productId,
  productName,
  isOpen,
  onClose,
}: ProductHistoryModalProps) {
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  // tRPC query to load history
  const historyQuery = trpc.inventory.getProductHistory.useQuery(
    {
      productId,
      cursor: cursor || null,
      limit: 7,
    },
    {
      enabled: isOpen && !!productId,
      refetchOnWindowFocus: false,
    }
  );

  // Reset list when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setHistoryItems([]);
      setCursor(undefined);
      setHasMore(true);
    }
  }, [isOpen, productId]);

  // Append new data when loaded
  useEffect(() => {
    if (historyQuery.data) {
      const newItems = historyQuery.data.items;
      setHistoryItems((prev) => {
        // Prevent duplicate items
        const existingIds = new Set(prev.map((item) => item.id));
        const filteredNew = newItems.filter((item) => !existingIds.has(item.id));
        return [...prev, ...filteredNew];
      });

      if (historyQuery.data.nextCursor) {
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    }
  }, [historyQuery.data]);

  if (!isOpen) return null;

  const loadMore = () => {
    if (historyQuery.data?.nextCursor) {
      setCursor(historyQuery.data.nextCursor);
    }
  };

  const getMovementTypeDetails = (type: string) => {
    switch (type.toUpperCase()) {
      case 'IN':
        return {
          label: 'Giriş (IN)',
          bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/35',
          icon: <ArrowDownLeft className="w-4 h-4 text-emerald-500" />,
        };
      case 'OUT':
        return {
          label: 'Çıkış (OUT)',
          bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/35 dark:text-rose-400 border-rose-100 dark:border-rose-900/35',
          icon: <ArrowUpRight className="w-4 h-4 text-rose-500" />,
        };
      case 'TRANSFER':
        return {
          label: 'Transfer',
          bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-400 border-blue-100 dark:border-blue-900/35',
          icon: <ArrowRightLeft className="w-4 h-4 text-blue-500" />,
        };
      case 'ADJUSTMENT':
        return {
          label: 'Düzeltme (ADJ)',
          bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/35 dark:text-amber-400 border-amber-100 dark:border-amber-900/35',
          icon: <Scale className="w-4 h-4 text-amber-500" />,
        };
      default:
        return {
          label: type,
          bg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
          icon: <History className="w-4 h-4 text-zinc-500" />,
        };
    }
  };

  const renderLocationText = (loc: any) => {
    if (!loc) return '';
    return `${loc.zone}-${loc.aisle}${loc.shelf}${loc.bin || ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <History className="w-5 h-5 text-indigo-650" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Ürün Geçmiş Timeline'ı
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-0.5 font-semibold">
                {productName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Vertical Timeline */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {historyItems.length === 0 && historyQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
              <p className="text-xs text-zinc-450 font-medium">Timeline yükleniyor...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="text-center py-16 text-xs text-zinc-450 font-medium">
              Bu ürüne ait herhangi bir envanter hareket geçmişi bulunamadı.
            </div>
          ) : (
            <div className="relative border-l border-zinc-150 dark:border-zinc-800 ml-3 pl-6 space-y-6">
              {historyItems.map((item, index) => {
                const details = getMovementTypeDetails(item.type);
                return (
                  <div key={item.id} className="relative group">
                    {/* Circle Indicator on line */}
                    <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform duration-200 group-hover:scale-110">
                      {details.icon}
                    </span>

                    {/* Timeline Card */}
                    <div className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all shadow-sm">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${details.bg}`}>
                          {details.label}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleString('tr-TR')}
                        </div>
                      </div>

                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                          {item.quantity} Adet
                        </span>
                        {item.type === 'TRANSFER' && (
                          <span className="text-[11px] text-zinc-500">
                            ({renderLocationText(item.fromLocation)} &rarr; {renderLocationText(item.toLocation)})
                          </span>
                        )}
                        {item.type === 'IN' && (
                          <span className="text-[11px] text-zinc-500">
                            ({renderLocationText(item.toLocation)} Lokasyonuna)
                          </span>
                        )}
                        {item.type === 'OUT' && (
                          <span className="text-[11px] text-zinc-500">
                            ({renderLocationText(item.fromLocation)} Lokasyonundan)
                          </span>
                        )}
                        {item.type === 'ADJUSTMENT' && (
                          <span className="text-[11px] text-zinc-500">
                            ({renderLocationText(item.toLocation)} Düzeltmesi)
                          </span>
                        )}
                      </div>

                      {item.reason && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 bg-white dark:bg-zinc-900/60 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                          {item.reason}
                        </p>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/40 flex items-center gap-1.5 text-[11px] text-zinc-450">
                        <User className="w-3.5 h-3.5" />
                        <span>Yapan: <strong className="text-zinc-650 dark:text-zinc-300 font-semibold">{item.user?.name || 'Sistem'}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loader or load more */}
          {hasMore && historyItems.length > 0 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={historyQuery.isFetching}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {historyQuery.isFetching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Daha Fazla Yükle
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
