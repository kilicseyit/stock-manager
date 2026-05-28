'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  BarChart3,
  MapPin,
  RefreshCw,
  Settings,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import DashboardWidget from '@/components/features/dashboard/DashboardWidget';
import WidgetSettingsModal from '@/components/features/dashboard/WidgetSettingsModal';

const MovementTrendChart = dynamic(
  () => import('@/components/features/dashboard/MovementTrendChart'),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-zinc-100/50 dark:bg-zinc-800/20 animate-pulse rounded-xl" />,
  }
);

const CategoryDistributionChart = dynamic(
  () => import('@/components/features/dashboard/CategoryDistributionChart'),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-zinc-100/50 dark:bg-zinc-800/20 animate-pulse rounded-xl" />,
  }
);

const TopProductsChart = dynamic(
  () => import('@/components/features/dashboard/TopProductsChart'),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-zinc-100/50 dark:bg-zinc-800/20 animate-pulse rounded-xl" />,
  }
);

const LocationOccupancyChart = dynamic(
  () => import('@/components/features/dashboard/LocationOccupancyChart'),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-zinc-100/50 dark:bg-zinc-800/20 animate-pulse rounded-xl" />,
  }
);

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/50" />
        <div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/50" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [daysFilter, setDaysFilter] = useState(30);

  const [widgetOrder, setWidgetOrder] = useState<string[]>(['kpi', 'trend', 'category', 'top-products', 'occupancy']);
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>({
    kpi: true,
    trend: true,
    category: true,
    'top-products': true,
    occupancy: true,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboard_widget_order');
    const savedVisibility = localStorage.getItem('dashboard_widget_visibility');
    if (savedOrder) {
      try {
        setWidgetOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedVisibility) {
      try {
        setWidgetVisibility(JSON.parse(savedVisibility));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveWidgetOrder = (newOrder: string[]) => {
    setWidgetOrder(newOrder);
    localStorage.setItem('dashboard_widget_order', JSON.stringify(newOrder));
  };

  const handleToggleVisibility = (id: string) => {
    const newVisibility = { ...widgetVisibility, [id]: !widgetVisibility[id] };
    setWidgetVisibility(newVisibility);
    localStorage.setItem('dashboard_widget_visibility', JSON.stringify(newVisibility));
  };

  const handleResetSettings = () => {
    const defaultOrder = ['kpi', 'trend', 'category', 'top-products', 'occupancy'];
    const defaultVisibility = {
      kpi: true,
      trend: true,
      category: true,
      'top-products': true,
      occupancy: true,
    };
    setWidgetOrder(defaultOrder);
    setWidgetVisibility(defaultVisibility);
    localStorage.removeItem('dashboard_widget_order');
    localStorage.removeItem('dashboard_widget_visibility');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as string);
      const newIndex = widgetOrder.indexOf(over.id as string);
      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      saveWidgetOrder(newOrder);
    }
  };

  // tRPC Queries
  const kpisQuery = trpc.analytics.getKPIs.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const trendQuery = trpc.analytics.getStockMovementTrend.useQuery(
    { days: daysFilter },
    { refetchOnWindowFocus: false }
  );

  const topProductsQuery = trpc.analytics.getTopProducts.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const categoryQuery = trpc.analytics.getCategoryDistribution.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const occupancyQuery = trpc.analytics.getLocationOccupancy.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const isLoading =
    kpisQuery.isLoading ||
    trendQuery.isLoading ||
    topProductsQuery.isLoading ||
    categoryQuery.isLoading ||
    occupancyQuery.isLoading;

  const handleRefresh = () => {
    kpisQuery.refetch();
    trendQuery.refetch();
    topProductsQuery.refetch();
    categoryQuery.refetch();
    occupancyQuery.refetch();
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const kpiData = kpisQuery.data ?? {
    totalProducts: 0,
    totalStockValue: 0,
    pendingOrders: 0,
    criticalStockCount: 0,
  };

  const kpis = [
    {
      title: 'Toplam SKU (Ürün)',
      value: kpiData.totalProducts,
      icon: Package,
      color: 'indigo',
      desc: 'Sistemde kayıtlı aktif ürün çeşidi',
    },
    {
      title: 'Toplam Stok Değeri',
      value: `₺${kpiData.totalStockValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'emerald',
      desc: 'Mevcut envanterin satın alma değeri',
    },
    {
      title: 'Bekleyen Sipariş',
      value: kpiData.pendingOrders,
      icon: FileText,
      color: 'amber',
      desc: 'Yolda olan veya kısmi kabul edilen siparişler',
    },
    {
      title: 'Kritik Stok Uyarısı',
      value: kpiData.criticalStockCount,
      icon: AlertTriangle,
      color: 'rose',
      desc: 'Minimum stok seviyesinin altındaki kalemler',
    },
  ];

  const colorStyles = {
    indigo: 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-150 dark:border-indigo-900/30',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-150 dark:border-emerald-900/30',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-150 dark:border-amber-900/30',
    rose: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-150 dark:border-rose-900/30',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-550">
            Hoş Geldiniz, {session?.user?.name || 'Kullanıcı'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Depo operasyonları ve güncel envanter analitiği paneli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Days Filter */}
          <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDaysFilter(d)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  daysFilter === d
                    ? 'bg-white dark:bg-zinc-850 shadow-sm text-indigo-650 dark:text-indigo-400'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {d} Gün
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 transition-all active:scale-95"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 transition-all active:scale-95"
            title="Panel Ayarları"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customizable Drag & Drop Layout */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {widgetOrder.map((id) => {
              if (!widgetVisibility[id]) return null;

              switch (id) {
                case 'kpi':
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="Temel Göstergeler (KPI)"
                      icon={<TrendingUp className="w-4 h-4" />}
                      className="col-span-1 lg:col-span-3"
                    >
                      {/* KPI Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kpis.map((kpi) => {
                          const Icon = kpi.icon;
                          const colors = colorStyles[kpi.color as keyof typeof colorStyles];

                          return (
                            <div
                              key={kpi.title}
                              className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 backdrop-blur-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                  {kpi.title}
                                </span>
                                <div className={`p-2.5 rounded-xl border ${colors}`}>
                                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </div>
                              </div>

                              <div className="mt-4 space-y-1">
                                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                                  {kpi.value}
                                </span>
                                <p className="text-[11px] text-zinc-450 dark:text-zinc-500">{kpi.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </DashboardWidget>
                  );
                case 'trend':
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="Stok Giriş / Çıkış Hareketi Trendi"
                      icon={<Calendar className="w-4 h-4" />}
                      className="col-span-1 lg:col-span-2"
                    >
                      <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
                        <MovementTrendChart data={trendQuery.data} />
                      </div>
                    </DashboardWidget>
                  );
                case 'category':
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="Kategori Dağılımı"
                      icon={<Layers className="w-4 h-4" />}
                      className="col-span-1"
                    >
                      <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
                        <CategoryDistributionChart data={categoryQuery.data} />
                      </div>
                    </DashboardWidget>
                  );
                case 'top-products':
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="En Aktif Ürünler (Son Stok Hareket Sayıları)"
                      icon={<BarChart3 className="w-4 h-4" />}
                      className="col-span-1 lg:col-span-2"
                    >
                      <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
                        <TopProductsChart data={topProductsQuery.data} />
                      </div>
                    </DashboardWidget>
                  );
                case 'occupancy':
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="En Dolu Lokasyonlar (%)"
                      icon={<MapPin className="w-4 h-4" />}
                      className="col-span-1"
                    >
                      <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
                        <LocationOccupancyChart data={occupancyQuery.data} />
                      </div>
                    </DashboardWidget>
                  );
                default:
                  return null;
              }
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Widget Settings side drawer */}
      <WidgetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        widgetOrder={widgetOrder}
        widgetVisibility={widgetVisibility}
        onToggleVisibility={handleToggleVisibility}
        onReset={handleResetSettings}
      />
    </div>
  );
}
