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
  Warehouse,
  Truck,
  TrendingDown,
  CheckCircle,
  Coins,
  Lock,
  Plus,
  X,
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
import AddWidgetModal from '@/components/features/dashboard/AddWidgetModal';

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

const METRIC_DEFINITIONS = {
  'metric-totalWarehouses': {
    title: 'Toplam Depo Sayısı',
    icon: Warehouse,
    color: 'indigo',
    desc: 'Sistemde tanımlı toplam depo sayısı',
    valueKey: 'totalWarehouses',
    isCurrency: false,
  },
  'metric-totalLocations': {
    title: 'Toplam Lokasyon Sayısı',
    icon: MapPin,
    color: 'indigo',
    desc: 'Bölge ve raf lokasyonlarının toplamı',
    valueKey: 'totalLocations',
    isCurrency: false,
  },
  'metric-activeSuppliers': {
    title: 'Aktif Tedarikçi Sayısı',
    icon: Truck,
    color: 'emerald',
    desc: 'Sistemdeki tedarikçi ortaklar',
    valueKey: 'activeSuppliers',
    isCurrency: false,
  },
  'metric-ordersThisMonth': {
    title: 'Bu Ay Sipariş Sayısı',
    icon: FileText,
    color: 'amber',
    desc: 'Bu ay içinde açılan satın almalar',
    valueKey: 'ordersThisMonth',
    isCurrency: false,
  },
  'metric-stockInThisMonth': {
    title: 'Bu Ay Stok Girişi',
    icon: TrendingUp,
    color: 'emerald',
    desc: 'Giren toplam envanter miktarı (IN)',
    valueKey: 'stockInThisMonth',
    isCurrency: false,
  },
  'metric-stockOutThisMonth': {
    title: 'Bu Ay Stok Çıkışı',
    icon: TrendingDown,
    color: 'rose',
    desc: 'Çıkan toplam envanter miktarı (OUT)',
    valueKey: 'stockOutThisMonth',
    isCurrency: false,
  },
  'metric-completedOrders': {
    title: 'Tamamlanan Sipariş Sayısı',
    icon: CheckCircle,
    color: 'emerald',
    desc: 'Kabul edilen siparişlerin toplamı',
    valueKey: 'completedOrders',
    isCurrency: false,
  },
  'metric-pendingOrdersValue': {
    title: 'Bekleyen Sipariş Değeri',
    icon: Coins,
    color: 'amber',
    desc: 'Bekleyen teslimatların toplam değeri',
    valueKey: 'pendingOrdersValue',
    isCurrency: true,
  },
  'metric-mostOccupiedLocation': {
    title: 'En Dolu Lokasyon',
    icon: AlertTriangle,
    color: 'rose',
    desc: 'Doluluk yüzdesi en yüksek olan raf',
    valueKey: 'mostOccupiedLocation',
    isCurrency: false,
  },
  'metric-totalReservedStock': {
    title: 'Toplam Rezerve Stok',
    icon: Lock,
    color: 'amber',
    desc: 'Rezerve durumdaki toplam miktar',
    valueKey: 'totalReservedStock',
    isCurrency: false,
  },
};

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
  const [widgetSizes, setWidgetSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({
    trend: 'medium',
    category: 'small',
    'top-products': 'medium',
    occupancy: 'small',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboard_widget_order');
    const savedVisibility = localStorage.getItem('dashboard_widget_visibility');
    const savedSizes = localStorage.getItem('dashboard_widget_sizes');
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
    if (savedSizes) {
      try {
        setWidgetSizes(JSON.parse(savedSizes));
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

  const handleSizeChange = (id: string, newSize: 'small' | 'medium' | 'large') => {
    const newSizes = { ...widgetSizes, [id]: newSize };
    setWidgetSizes(newSizes);
    localStorage.setItem('dashboard_widget_sizes', JSON.stringify(newSizes));
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
    const defaultSizes: Record<string, 'small' | 'medium' | 'large'> = {
      trend: 'medium',
      category: 'small',
      'top-products': 'medium',
      occupancy: 'small',
    };
    setWidgetOrder(defaultOrder);
    setWidgetVisibility(defaultVisibility);
    setWidgetSizes(defaultSizes);
    localStorage.removeItem('dashboard_widget_order');
    localStorage.removeItem('dashboard_widget_visibility');
    localStorage.removeItem('dashboard_widget_sizes');
  };

  const handleAddWidget = (id: string) => {
    // 1. Görünürlüğü aç
    const newVisibility = { ...widgetVisibility, [id]: true };
    setWidgetVisibility(newVisibility);
    localStorage.setItem('dashboard_widget_visibility', JSON.stringify(newVisibility));

    // 2. Sıralama listesine ekle
    if (!widgetOrder.includes(id)) {
      const newOrder = [...widgetOrder, id];
      saveWidgetOrder(newOrder);
    }
  };

  const handleRemoveWidget = (id: string) => {
    // 1. Sıralama listesinden çıkar
    const newOrder = widgetOrder.filter((wId) => wId !== id);
    saveWidgetOrder(newOrder);

    // 2. Görünürlüğü kapat
    const newVisibility = { ...widgetVisibility, [id]: false };
    setWidgetVisibility(newVisibility);
    localStorage.setItem('dashboard_widget_visibility', JSON.stringify(newVisibility));
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

  const additionalMetricsQuery = trpc.analytics.getAdditionalMetrics.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const isLoading =
    kpisQuery.isLoading ||
    trendQuery.isLoading ||
    topProductsQuery.isLoading ||
    categoryQuery.isLoading ||
    occupancyQuery.isLoading ||
    additionalMetricsQuery.isLoading;

  const handleRefresh = () => {
    kpisQuery.refetch();
    trendQuery.refetch();
    topProductsQuery.refetch();
    categoryQuery.refetch();
    occupancyQuery.refetch();
    additionalMetricsQuery.refetch();
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

          {/* Widget Ekle Button */}
          <button
            onClick={() => setIsAddWidgetOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/10 hover:shadow active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Widget Ekle
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
                case 'trend': {
                  const currentSize = widgetSizes.trend || 'medium';
                  const sizeClass = currentSize === 'small' ? 'col-span-1' : currentSize === 'medium' ? 'col-span-1 lg:col-span-2' : 'col-span-1 lg:col-span-3';
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="Stok Giriş / Çıkış Hareketi Trendi"
                      icon={<Calendar className="w-4 h-4" />}
                      size={currentSize}
                      onSizeChange={(size) => handleSizeChange('trend', size)}
                      className={sizeClass}
                    >
                      <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
                        <MovementTrendChart data={trendQuery.data} />
                      </div>
                    </DashboardWidget>
                  );
                }
                case 'category': {
                  const currentSize = widgetSizes.category || 'small';
                  const sizeClass = currentSize === 'small' ? 'col-span-1' : currentSize === 'medium' ? 'col-span-1 lg:col-span-2' : 'col-span-1 lg:col-span-3';
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="Kategori Dağılımı"
                      icon={<Layers className="w-4 h-4" />}
                      size={currentSize}
                      onSizeChange={(size) => handleSizeChange('category', size)}
                      className={sizeClass}
                    >
                      <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
                        <CategoryDistributionChart data={categoryQuery.data} />
                      </div>
                    </DashboardWidget>
                  );
                }
                case 'top-products': {
                  const currentSize = widgetSizes['top-products'] || 'medium';
                  const sizeClass = currentSize === 'small' ? 'col-span-1' : currentSize === 'medium' ? 'col-span-1 lg:col-span-2' : 'col-span-1 lg:col-span-3';
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="En Aktif Ürünler (Son Stok Hareket Sayıları)"
                      icon={<BarChart3 className="w-4 h-4" />}
                      size={currentSize}
                      onSizeChange={(size) => handleSizeChange('top-products', size)}
                      className={sizeClass}
                    >
                      <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
                        <TopProductsChart data={topProductsQuery.data} />
                      </div>
                    </DashboardWidget>
                  );
                }
                case 'occupancy': {
                  const currentSize = widgetSizes.occupancy || 'small';
                  const sizeClass = currentSize === 'small' ? 'col-span-1' : currentSize === 'medium' ? 'col-span-1 lg:col-span-2' : 'col-span-1 lg:col-span-3';
                  return (
                    <DashboardWidget
                      key={id}
                      id={id}
                      title="En Dolu Lokasyonlar (%)"
                      icon={<MapPin className="w-4 h-4" />}
                      size={currentSize}
                      onSizeChange={(size) => handleSizeChange('occupancy', size)}
                      className={sizeClass}
                    >
                      <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
                        <LocationOccupancyChart data={occupancyQuery.data} />
                      </div>
                    </DashboardWidget>
                  );
                }
                default: {
                  if (id.startsWith('metric-')) {
                    const definition = METRIC_DEFINITIONS[id as keyof typeof METRIC_DEFINITIONS];
                    if (!definition) return null;
                    const Icon = definition.icon;
                    const colors = colorStyles[definition.color as keyof typeof colorStyles];
                    const rawValue = additionalMetricsQuery.data?.[definition.valueKey as keyof typeof additionalMetricsQuery.data] ?? 0;
                    
                    const displayValue = definition.isCurrency 
                      ? `₺${Number(rawValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                      : rawValue;

                    return (
                      <DashboardWidget
                        key={id}
                        id={id}
                        title={definition.title}
                        icon={<Icon className="w-4 h-4" />}
                        className="col-span-1"
                        onRemove={() => handleRemoveWidget(id)}
                      >
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">
                              Gösterge
                            </span>
                            <div className={`p-2 rounded-lg border ${colors}`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                          </div>
                          <div className="mt-4 space-y-1">
                            <span className="text-2xl font-black text-zinc-905 dark:text-zinc-50 tracking-tight">
                              {displayValue}
                            </span>
                            <p className="text-[11px] text-zinc-450 dark:text-zinc-500 leading-normal">{definition.desc}</p>
                          </div>
                        </div>
                      </DashboardWidget>
                    );
                  }
                  return null;
                }
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

      {/* Widget Ekle Modal */}
      <AddWidgetModal
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        widgetOrder={widgetOrder}
        onAddWidget={handleAddWidget}
        additionalMetrics={additionalMetricsQuery.data}
      />
    </div>
  );
}
