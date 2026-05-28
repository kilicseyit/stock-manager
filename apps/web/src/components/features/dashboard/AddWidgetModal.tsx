'use client';

import React from 'react';
import { 
  X, 
  Plus, 
  Check, 
  Warehouse, 
  MapPin, 
  Truck, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Coins, 
  AlertTriangle, 
  Lock,
  Package
} from 'lucide-react';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetOrder: string[];
  onAddWidget: (id: string) => void;
  additionalMetrics: Record<string, any> | undefined;
}

const METRIC_POOL = [
  {
    id: 'kpi-totalProducts',
    title: 'Toplam SKU (Ürün)',
    icon: Package,
    color: 'indigo',
    valueKey: 'totalProducts',
    isCurrency: false,
    desc: 'Sistemde kayıtlı aktif ürün çeşidi',
  },
  {
    id: 'kpi-totalStockValue',
    title: 'Toplam Stok Değeri',
    icon: TrendingUp,
    color: 'emerald',
    valueKey: 'totalStockValue',
    isCurrency: true,
    desc: 'Mevcut envanterin satın alma değeri',
  },
  {
    id: 'kpi-pendingOrders',
    title: 'Bekleyen Sipariş',
    icon: FileText,
    color: 'amber',
    valueKey: 'pendingOrders',
    isCurrency: false,
    desc: 'Yolda olan veya kısmi kabul edilen siparişler',
  },
  {
    id: 'kpi-criticalStockCount',
    title: 'Kritik Stok Uyarısı',
    icon: AlertTriangle,
    color: 'rose',
    valueKey: 'criticalStockCount',
    isCurrency: false,
    desc: 'Minimum stok seviyesinin altındaki kalemler',
  },
  {
    id: 'metric-totalWarehouses',
    title: 'Toplam Depo Sayısı',
    icon: Warehouse,
    color: 'indigo',
    valueKey: 'totalWarehouses',
    isCurrency: false,
    desc: 'Sistemde tanımlı toplam depo sayısı',
  },
  {
    id: 'metric-totalLocations',
    title: 'Toplam Lokasyon Sayısı',
    icon: MapPin,
    color: 'indigo',
    valueKey: 'totalLocations',
    isCurrency: false,
    desc: 'Bölge ve raf lokasyonlarının toplamı',
  },
  {
    id: 'metric-activeSuppliers',
    title: 'Aktif Tedarikçi Sayısı',
    icon: Truck,
    color: 'emerald',
    valueKey: 'activeSuppliers',
    isCurrency: false,
    desc: 'Sistemdeki tedarikçi ortaklar',
  },
  {
    id: 'metric-ordersThisMonth',
    title: 'Bu Ay Sipariş Sayısı',
    icon: FileText,
    color: 'amber',
    valueKey: 'ordersThisMonth',
    isCurrency: false,
    desc: 'Bu ay içinde açılan satın almalar',
  },
  {
    id: 'metric-stockInThisMonth',
    title: 'Bu Ay Stok Girişi',
    icon: TrendingUp,
    color: 'emerald',
    valueKey: 'stockInThisMonth',
    isCurrency: false,
    desc: 'Giren toplam stok miktarı (IN)',
  },
  {
    id: 'metric-stockOutThisMonth',
    title: 'Bu Ay Stok Çıkışı',
    icon: TrendingDown,
    color: 'rose',
    valueKey: 'stockOutThisMonth',
    isCurrency: false,
    desc: 'Çıkan toplam stok miktarı (OUT)',
  },
  {
    id: 'metric-completedOrders',
    title: 'Tamamlanan Sipariş Sayısı',
    icon: CheckCircle,
    color: 'emerald',
    valueKey: 'completedOrders',
    isCurrency: false,
    desc: 'Kabul edilen siparişlerin toplamı',
  },
  {
    id: 'metric-pendingOrdersValue',
    title: 'Bekleyen Sipariş Değeri',
    icon: Coins,
    color: 'amber',
    valueKey: 'pendingOrdersValue',
    isCurrency: true,
    desc: 'Bekleyen teslimatların toplam değeri',
  },
  {
    id: 'metric-mostOccupiedLocation',
    title: 'En Dolu Lokasyon',
    icon: AlertTriangle,
    color: 'rose',
    valueKey: 'mostOccupiedLocation',
    isCurrency: false,
    desc: 'Doluluk yüzdesi en yüksek olan raf',
  },
  {
    id: 'metric-totalReservedStock',
    title: 'Toplam Rezerve Stok',
    icon: Lock,
    color: 'amber',
    valueKey: 'totalReservedStock',
    isCurrency: false,
    desc: 'Rezerve durumdaki toplam miktar',
  },
];

const colorStyles = {
  indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-150 dark:border-indigo-900/30',
  emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-150 dark:border-emerald-900/30',
  amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-150 dark:border-amber-900/30',
  rose: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-150 dark:border-rose-900/30',
};

export default function AddWidgetModal({
  isOpen,
  onClose,
  widgetOrder,
  onAddWidget,
  additionalMetrics,
}: AddWidgetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-slideUpSimple max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-150">
              Widget (Gösterge Kartı) Ekle
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Panelinize ekleyebileceğiniz hazır metrik havuzu
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {METRIC_POOL.map((metric) => {
              const Icon = metric.icon;
              const isAdded = widgetOrder.includes(metric.id);
              const colors = colorStyles[metric.color as keyof typeof colorStyles];
              const rawValue = additionalMetrics?.[metric.valueKey as keyof typeof additionalMetrics] ?? 0;
              
              const displayValue = metric.isCurrency 
                ? `₺${Number(rawValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                : rawValue;

              return (
                <div 
                  key={metric.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isAdded 
                      ? 'border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {metric.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[190px]">
                        {metric.desc}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg border ${colors}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {displayValue}
                      </span>
                    </div>

                    {isAdded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                        <Check className="w-3 h-3" />
                        Eklendi
                      </span>
                    ) : (
                      <button
                        onClick={() => onAddWidget(metric.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-700 active:bg-indigo-850 text-white text-[10px] font-bold transition-all shadow-sm shadow-indigo-650/10 hover:shadow"
                      >
                        <Plus className="w-3 h-3" />
                        Ekle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-650/10"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
