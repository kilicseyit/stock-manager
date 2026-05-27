'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Wrench,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';

const movementTypeConfig: Record<string, { label: string; color: string }> = {
  IN: { label: 'Giriş', color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' },
  OUT: { label: 'Çıkış', color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' },
  TRANSFER: { label: 'Transfer', color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' },
  ADJUSTMENT: { label: 'Düzeltme', color: 'bg-zinc-50 dark:bg-zinc-800/30 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800/30' },
};

function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
      <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: stats, isLoading } = trpc.inventory.getDashboardStats.useQuery(undefined, {
    refetchInterval: 60_000, // 1 dakika
  });

  const statCards = [
    {
      title: 'Toplam Ürün',
      value: stats?.totalProducts ?? '—',
      icon: Package,
      color: 'indigo' as const,
      change: null as string | null,
      isPositive: null as boolean | null,
      href: '/urunler',
    },
    {
      title: 'Düşük Stok Uyarıları',
      value: stats?.lowStockCount ?? '—',
      icon: AlertTriangle,
      color: 'rose' as const,
      change: stats?.lowStockCount ? `${stats.lowStockCount} kalem` : null,
      isPositive: stats?.lowStockCount === 0 ? true : false,
      href: '/stok',
    },
    {
      title: 'Toplam Stok Hareketi',
      value: stats?.totalMovements ?? '—',
      icon: TrendingUp,
      color: 'emerald' as const,
      change: null,
      isPositive: null,
      href: '/stok',
    },
    {
      title: 'Aktif Depolar',
      value: '1',
      icon: Warehouse,
      color: 'amber' as const,
      change: 'Sabit durum',
      isPositive: null,
      href: '/lokasyonlar',
    },
  ];

  const colorMap = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hoş Geldiniz, {session?.user?.name || 'Kullanıcı'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Depo durumuna ve güncel operasyonlara genel bakış.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat) => {
              const Icon = stat.icon;
              const colors = colorMap[stat.color];
              return (
                <Link
                  href={stat.href}
                  key={stat.title}
                  className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl flex flex-col justify-between shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {stat.title}
                    </span>
                    <div className={`p-2.5 rounded-xl border ${colors}`}>
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                      {String(stat.value)}
                    </span>

                    {stat.isPositive !== null && stat.change && (
                      <div className="flex items-center gap-1 mt-2">
                        {stat.isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span className={`text-xs font-semibold ${stat.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {stat.change}
                        </span>
                      </div>
                    )}
                    {stat.isPositive === null && stat.change && (
                      <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                        {stat.change}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Son Stok Hareketleri</h2>
            </div>
            <Link
              href="/stok"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Tümünü Gör
              <LinkIcon className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
              ))}
            </div>
          ) : !stats?.recentMovements.length ? (
            <div className="py-12 text-center">
              <History className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Henüz stok hareketi yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-medium">
                    <th className="pb-3 font-semibold">Tür</th>
                    <th className="pb-3 font-semibold">Ürün</th>
                    <th className="pb-3 font-semibold text-right">Miktar</th>
                    <th className="pb-3 font-semibold">Kullanıcı</th>
                    <th className="pb-3 font-semibold text-right">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/50">
                  {stats.recentMovements.map((m) => {
                    const cfg = movementTypeConfig[m.type] ?? movementTypeConfig.IN;
                    return (
                      <tr key={m.id} className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-zinc-900 dark:text-zinc-50">
                          <div>
                            <p>{m.product.name}</p>
                            <p className="text-xs text-zinc-400">{m.product.sku}</p>
                          </div>
                        </td>
                        <td className={`py-3 text-right font-semibold ${m.type === 'OUT' ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {m.type === 'OUT' ? '-' : '+'}{m.quantity}
                        </td>
                        <td className="py-3 text-zinc-500 dark:text-zinc-400 text-xs">
                          {m.user?.name ?? '—'}
                        </td>
                        <td className="py-3 text-right text-xs text-zinc-400 dark:text-zinc-500">
                          {new Date(m.createdAt).toLocaleDateString('tr-TR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alert + Quick Operations */}
        <div className="space-y-6">
          {/* Düşük Stok */}
          {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
            <div className="p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 backdrop-blur-xl shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Düşük Stok Uyarıları</h3>
              </div>
              <ul className="space-y-2">
                {stats.lowStockItems.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[150px]">
                      {item.product.name}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      {item.quantity} / {item.product.minStock}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/stok" className="block text-center text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline pt-1">
                Stok sayfasına git →
              </Link>
            </div>
          )}

          {/* Hızlı İşlemler */}
          <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Hızlı İşlemler</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/stok" className="flex flex-col items-start p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Mal Kabul Yap</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Depoya yeni ürün girişi kaydet</span>
              </Link>
              <Link href="/urunler" className="flex flex-col items-start p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Yeni Ürün Ekle</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Kataloğa yeni bir SKU tanımla</span>
              </Link>
              <Link href="/lokasyonlar" className="flex flex-col items-start p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Lokasyon Ekle</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Depo raf / bölge tanımla</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
