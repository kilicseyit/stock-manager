import React from 'react';
import { auth } from '@/auth';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Warehouse, 
  ArrowUpRight, 
  ArrowDownRight, 
  History 
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  // Mock dashboard stats
  const stats = [
    {
      title: 'Toplam Ürün',
      value: '1,248',
      change: '+12%',
      isPositive: true,
      icon: Package,
      color: 'indigo',
    },
    {
      title: 'Düşük Stok Uyarıları',
      value: '14',
      change: '-3',
      isPositive: true,
      icon: AlertTriangle,
      color: 'rose',
    },
    {
      title: 'Bekleyen Siparişler',
      value: '8',
      change: '+24%',
      isPositive: true,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Aktif Depolar',
      value: '3',
      change: 'Sabit',
      isPositive: null,
      icon: Warehouse,
      color: 'amber',
    },
  ];

  const recentActivity = [
    { id: 1, type: 'Giriş', product: 'MacBook Pro 16"', qty: 25, user: 'Ahmet Y.', time: '10 dakika önce', status: 'completed' },
    { id: 2, type: 'Çıkış', product: 'iPhone 15 Pro Max', qty: 5, user: 'Ayşe K.', time: '34 dakika önce', status: 'completed' },
    { id: 3, type: 'Transfer', product: 'Logitech MX Master 3S', qty: 50, user: 'Mehmet S.', time: '1 saat önce', status: 'completed' },
    { id: 4, type: 'Düzeltme', product: 'Dell UltraSharp 27"', qty: -2, user: 'Ahmet Y.', time: '3 saat önce', status: 'completed' },
  ];

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
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          // Tailwind v4 dynamic colors mapping
          const colors = {
            indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30',
            rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30',
            emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30',
            amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30',
          }[stat.color as 'indigo' | 'rose' | 'emerald' | 'amber'];

          return (
            <div
              key={stat.title}
              className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
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
                  {stat.value}
                </span>
                
                {stat.isPositive !== null && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span className={`text-xs font-semibold ${stat.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stat.change}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">geçen haftaya göre</span>
                  </div>
                )}
                {stat.isPositive === null && (
                  <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    {stat.change} durum
                  </div>
                )}
              </div>
            </div>
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
            <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Tümünü Gör
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-medium">
                  <th className="pb-3 font-semibold">Tür</th>
                  <th className="pb-3 font-semibold">Ürün</th>
                  <th className="pb-3 font-semibold text-right">Miktar</th>
                  <th className="pb-3 font-semibold">İşlem Yapan</th>
                  <th className="pb-3 font-semibold text-right">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/50">
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="text-zinc-700 dark:text-zinc-300 group hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                        activity.type === 'Giriş' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                          : activity.type === 'Çıkış'
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                          : 'bg-zinc-50 dark:bg-zinc-800/30 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800/30'
                      }`}>
                        {activity.type}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-zinc-900 dark:text-zinc-50">{activity.product}</td>
                    <td className={`py-3 text-right font-semibold ${activity.qty > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {activity.qty > 0 ? `+${activity.qty}` : activity.qty}
                    </td>
                    <td className="py-3 text-zinc-500 dark:text-zinc-400 text-xs">{activity.user}</td>
                    <td className="py-3 text-right text-xs text-zinc-400 dark:text-zinc-500">{activity.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations panel */}
        <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Hızlı İşlemler</h2>
          
          <div className="grid grid-cols-1 gap-3">
            <button className="flex flex-col items-start p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Mal Kabul Yap</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Depoya yeni ürün girişi kaydet</span>
            </button>

            <button className="flex flex-col items-start p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Stok Sevk Et</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Sipariş çıkışı veya depo transferi başlat</span>
            </button>

            <button className="flex flex-col items-start p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Yeni Ürün Ekle</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Kataloğa yeni bir SKU tanımla</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
