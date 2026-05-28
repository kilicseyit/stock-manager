'use client';

import React from 'react';
import { X, Eye, EyeOff, Settings, RefreshCw } from 'lucide-react';

interface WidgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetOrder: string[];
  widgetVisibility: Record<string, boolean>;
  onToggleVisibility: (id: string) => void;
  onReset: () => void;
}

const WIDGET_NAMES: Record<string, { name: string; desc: string }> = {
  kpi: { name: 'Temel Göstergeler (KPI)', desc: 'Toplam ürün sayısı, stok değeri, bekleyen siparişler ve kritik stok sayıları' },
  trend: { name: 'Stok Giriş/Çıkış Trendi', desc: 'Son günlerdeki envanter hareketlerinin karşılaştırmalı çizgi grafiği' },
  category: { name: 'Kategori Dağılımı', desc: 'Ürünlerin kategorilere göre dağılımını gösteren pasta grafiği' },
  'top-products': { name: 'En Aktif Ürünler', desc: 'En çok stok hareketi gören ilk 5 ürün ve işlem sayıları' },
  occupancy: { name: 'Lokasyon Doluluk Oranları', desc: 'Depodaki rafların doluluk yüzdeleri ve doluluk haritası' },
};

export default function WidgetSettingsModal({
  isOpen,
  onClose,
  widgetOrder,
  widgetVisibility,
  onToggleVisibility,
  onReset,
}: WidgetSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-zinc-950/40 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-150 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-150">
              Panel Görünüm Ayarları
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Dashboard panelinde görüntülenecek grafikleri ve kartları seçin. Sıralamayı değiştirmek için panel üzerindeki sürükleme kulplarını kullanabilirsiniz.
          </p>

          <div className="space-y-4">
            {widgetOrder.map((id) => {
              const info = WIDGET_NAMES[id];
              if (!info) return null;
              const isVisible = widgetVisibility[id];

              return (
                <div 
                  key={id}
                  className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                    isVisible
                      ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10'
                      : 'border-zinc-100 dark:border-zinc-850/50 bg-zinc-50/10 dark:bg-zinc-900/5 opacity-60'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {info.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                      {info.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => onToggleVisibility(id)}
                    className={`p-2 rounded-xl border transition-all shrink-0 ${
                      isVisible
                        ? 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-400'
                    }`}
                    title={isVisible ? 'Gizle' : 'Göster'}
                  >
                    {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sıfırla
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/10"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
