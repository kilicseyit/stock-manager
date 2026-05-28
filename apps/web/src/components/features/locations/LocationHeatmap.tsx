'use client';

import React, { useMemo } from 'react';
import { Warehouse, Info } from 'lucide-react';

interface LocationHeatmapProps {
  locations: Array<{
    id: string;
    zone: string;
    aisle: string | null;
    shelf: string | null;
    bin: string | null;
    warehouse: { id: string; name: string };
    _count?: { stockItems: number } | null;
    stockItems?: Array<{ quantity: number }> | null;
  }>;
}

export default function LocationHeatmap({ locations }: LocationHeatmapProps) {
  const warehousesData = useMemo(() => {
    const groups: Record<string, typeof locations> = {};
    locations.forEach((loc) => {
      const whName = loc.warehouse?.name || 'Genel';
      if (!groups[whName]) {
        groups[whName] = [];
      }
      groups[whName].push(loc);
    });
    return groups;
  }, [locations]);

  const calculateOccupancy = (loc: typeof locations[0]) => {
    const totalQty = loc.stockItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const capacity = 155; 
    const rate = Math.min(100, Math.round((totalQty / capacity) * 100));
    return { totalQty, rate };
  };

  const getColorClass = (rate: number, totalQty: number) => {
    if (totalQty === 0) return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-550 border-zinc-200 dark:border-zinc-700';
    if (rate <= 30) return 'bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-900/30';
    if (rate <= 70) return 'bg-amber-500/10 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-900/30';
    if (rate < 100) return 'bg-orange-500/10 dark:bg-orange-950/20 text-orange-650 dark:text-orange-400 border-orange-500/20 dark:border-orange-900/30';
    return 'bg-red-500/10 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-900/30 font-bold';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs">
        <span className="font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mr-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          RENK SKALASI (DOLULUK):
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" />
          <span className="text-zinc-650 dark:text-zinc-400">%0 (Boş)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 dark:border-emerald-900/30" />
          <span className="text-zinc-650 dark:text-zinc-400">%1-30</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/20 dark:border-amber-900/30" />
          <span className="text-zinc-650 dark:text-zinc-400">%31-70</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border bg-orange-500/10 dark:bg-orange-950/20 border-orange-500/20 dark:border-orange-900/30" />
          <span className="text-zinc-650 dark:text-zinc-400">%71-99</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border bg-red-500/10 dark:bg-red-950/20 border-red-500/20 dark:border-red-900/30" />
          <span className="text-zinc-650 dark:text-zinc-400">%100 (Dolu)</span>
        </div>
      </div>

      {Object.entries(warehousesData).map(([whName, whLocs]) => {
        const zones = Array.from(new Set(whLocs.map((l) => l.zone))).sort();
        const shelves = Array.from(
          new Set(whLocs.map((l) => l.shelf || 'Tanımsız'))
        ).sort((a, b) => {
          if (a === 'Tanımsız') return 1;
          if (b === 'Tanımsız') return -1;
          return a.localeCompare(b, undefined, { numeric: true });
        });

        return (
          <div 
            key={whName} 
            className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm space-y-6"
          >
            {/* Warehouse Header */}
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <Warehouse className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                {whName} Depo Isı Haritası
              </h3>
            </div>

            {/* Grid Map */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-xs font-bold text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                      Bölge / Raf
                    </th>
                    {shelves.map((sh) => (
                      <th 
                        key={sh} 
                        className="p-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 min-w-[80px]"
                      >
                        Raf {sh}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zn) => (
                    <tr key={zn} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-850/10">
                      <td className="p-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 font-mono">
                        {zn}
                      </td>

                      {shelves.map((sh) => {
                        const matchingLocs = whLocs.filter(
                          (l) => l.zone === zn && (l.shelf || 'Tanımsız') === sh
                        );

                        return (
                          <td 
                            key={sh} 
                            className="p-3 border border-zinc-100 dark:border-zinc-800 align-middle"
                          >
                            <div className="flex flex-wrap justify-center gap-1.5">
                              {matchingLocs.length === 0 ? (
                                <span className="text-xs text-zinc-300 dark:text-zinc-700 select-none">—</span>
                              ) : (
                                matchingLocs.map((loc) => {
                                  const { totalQty, rate } = calculateOccupancy(loc);
                                  const colorClass = getColorClass(rate, totalQty);
                                  const locName = `${loc.zone}-${loc.aisle || 'x'}-${loc.shelf || 'x'}-${loc.bin || 'x'}`;

                                  return (
                                    <div
                                      key={loc.id}
                                      className={`group relative w-8 h-8 rounded-lg flex items-center justify-center text-[10px] transition-all cursor-help border hover:scale-110 shadow-sm ${colorClass}`}
                                    >
                                      {rate}%
                                      
                                      {/* Custom Tooltip */}
                                      <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-52 p-3.5 rounded-xl bg-zinc-950/95 dark:bg-zinc-900/95 text-white text-xs text-left shadow-2xl border border-zinc-850 dark:border-zinc-800/80 animate-fadeIn pointer-events-none">
                                        <div className="font-bold text-zinc-100 mb-1.5 flex items-center gap-1.5 border-b border-zinc-800 pb-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                          Lokasyon: {locName}
                                        </div>
                                        <div className="space-y-1 font-medium text-zinc-300">
                                          <p>Ürün Sayısı: <span className="font-bold text-white">{loc._count?.stockItems || 0}</span></p>
                                          <p>Toplam Miktar: <span className="font-bold text-white">{totalQty} adet</span></p>
                                          <p>Doluluk Oranı: <span className="font-bold text-white">{rate}%</span></p>
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950 dark:border-t-zinc-900" />
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
