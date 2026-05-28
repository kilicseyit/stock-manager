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
  useDroppable,
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

const ALL_METRICS = {
  // Default KPIs
  'kpi-totalProducts': {
    title: 'Toplam SKU (Ürün)',
    icon: Package,
    color: 'indigo',
    desc: 'Sistemde kayıtlı aktif ürün çeşidi',
    valueKey: 'totalProducts',
    isCurrency: false,
  },
  'kpi-totalStockValue': {
    title: 'Toplam Stok Değeri',
    icon: TrendingUp,
    color: 'emerald',
    desc: 'Mevcut envanterin satın alma değeri',
    valueKey: 'totalStockValue',
    isCurrency: true,
  },
  'kpi-pendingOrders': {
    title: 'Bekleyen Sipariş',
    icon: FileText,
    color: 'amber',
    desc: 'Yolda olan veya kısmi kabul edilen siparişler',
    valueKey: 'pendingOrders',
    isCurrency: false,
  },
  'kpi-criticalStockCount': {
    title: 'Kritik Stok Uyarısı',
    icon: AlertTriangle,
    color: 'rose',
    desc: 'Minimum stok seviyesinin altındaki kalemler',
    valueKey: 'criticalStockCount',
    isCurrency: false,
  },
  // Custom Metrics
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

const colorStyles = {
  indigo: 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-150 dark:border-indigo-900/30',
  emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-150 dark:border-emerald-900/30',
  amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-150 dark:border-amber-900/30',
  rose: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-150 dark:border-rose-900/30',
};

interface DroppableContainerProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function DroppableContainer({ id, children, className }: DroppableContainerProps) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [daysFilter, setDaysFilter] = useState(30);

  const [kpiWidgets, setKpiWidgets] = useState<string[]>([
    'kpi-totalProducts',
    'kpi-totalStockValue',
    'kpi-pendingOrders',
    'kpi-criticalStockCount'
  ]);
  const [mainWidgets, setMainWidgets] = useState<string[]>([
    'trend',
    'category',
    'top-products',
    'occupancy'
  ]);
  const [widgetSizes, setWidgetSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({
    trend: 'medium',
    category: 'small',
    'top-products': 'medium',
    occupancy: 'small',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  useEffect(() => {
    const savedKpis = localStorage.getItem('dashboard_kpi_widgets');
    const savedMain = localStorage.getItem('dashboard_main_widgets');
    const savedSizes = localStorage.getItem('dashboard_widget_sizes');
    if (savedKpis) {
      try {
        setKpiWidgets(JSON.parse(savedKpis));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedMain) {
      try {
        setMainWidgets(JSON.parse(savedMain));
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

  const findContainer = (id: string) => {
    if (id === 'kpi') return 'kpi';
    if (id === 'widgets') return 'widgets';
    if (kpiWidgets.includes(id)) return 'kpi';
    if (mainWidgets.includes(id)) return 'widgets';
    return null;
  };

  const handleSizeChange = (id: string, newSize: 'small' | 'medium' | 'large') => {
    const newSizes = { ...widgetSizes, [id]: newSize };
    setWidgetSizes(newSizes);
    localStorage.setItem('dashboard_widget_sizes', JSON.stringify(newSizes));
  };

  const handleResetSettings = () => {
    const defaultKpis = [
      'kpi-totalProducts',
      'kpi-totalStockValue',
      'kpi-pendingOrders',
      'kpi-criticalStockCount'
    ];
    const defaultMain = [
      'trend',
      'category',
      'top-products',
      'occupancy'
    ];
    const defaultSizes: Record<string, 'small' | 'medium' | 'large'> = {
      trend: 'medium',
      category: 'small',
      'top-products': 'medium',
      occupancy: 'small',
    };
    setKpiWidgets(defaultKpis);
    setMainWidgets(defaultMain);
    setWidgetSizes(defaultSizes);
    localStorage.setItem('dashboard_kpi_widgets', JSON.stringify(defaultKpis));
    localStorage.setItem('dashboard_main_widgets', JSON.stringify(defaultMain));
    localStorage.setItem('dashboard_widget_sizes', JSON.stringify(defaultSizes));
  };

  const handleAddWidget = (id: string) => {
    if (id.startsWith('kpi-')) {
      if (!kpiWidgets.includes(id)) {
        const newKpis = [...kpiWidgets, id];
        setKpiWidgets(newKpis);
        localStorage.setItem('dashboard_kpi_widgets', JSON.stringify(newKpis));
      }
    } else {
      if (!mainWidgets.includes(id)) {
        const newMain = [...mainWidgets, id];
        setMainWidgets(newMain);
        localStorage.setItem('dashboard_main_widgets', JSON.stringify(newMain));
      }
    }
  };

  const handleRemoveWidget = (id: string) => {
    if (kpiWidgets.includes(id)) {
      const newKpis = kpiWidgets.filter((wId) => wId !== id);
      setKpiWidgets(newKpis);
      localStorage.setItem('dashboard_kpi_widgets', JSON.stringify(newKpis));
    }
    if (mainWidgets.includes(id)) {
      const newMain = mainWidgets.filter((wId) => wId !== id);
      setMainWidgets(newMain);
      localStorage.setItem('dashboard_main_widgets', JSON.stringify(newMain));
    }
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

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    if (activeContainer === 'kpi' && overContainer === 'widgets') {
      setKpiWidgets((prev) => prev.filter((id) => id !== activeId));
      setMainWidgets((prev) => {
        const overIndex = prev.indexOf(overId);
        if (overIndex === -1) return [...prev, activeId];
        return [...prev.slice(0, overIndex), activeId, ...prev.slice(overIndex)];
      });
    } else if (activeContainer === 'widgets' && overContainer === 'kpi') {
      setMainWidgets((prev) => prev.filter((id) => id !== activeId));
      setKpiWidgets((prev) => {
        const overIndex = prev.indexOf(overId);
        if (overIndex === -1) return [...prev, activeId];
        return [...prev.slice(0, overIndex), activeId, ...prev.slice(overIndex)];
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    let latestKpis = [...kpiWidgets];
    let latestMain = [...mainWidgets];

    if (over) {
      const activeId = active.id as string;
      const overId = over.id as string;

      const activeContainer = findContainer(activeId);
      const overContainer = findContainer(overId);

      if (activeContainer && overContainer && activeContainer === overContainer) {
        if (activeContainer === 'kpi') {
          const oldIndex = kpiWidgets.indexOf(activeId);
          const newIndex = kpiWidgets.indexOf(overId);
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            latestKpis = arrayMove(kpiWidgets, oldIndex, newIndex);
            setKpiWidgets(latestKpis);
          }
        } else {
          const oldIndex = mainWidgets.indexOf(activeId);
          const newIndex = mainWidgets.indexOf(overId);
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            latestMain = arrayMove(mainWidgets, oldIndex, newIndex);
            setMainWidgets(latestMain);
          }
        }
      }
    }

    localStorage.setItem('dashboard_kpi_widgets', JSON.stringify(latestKpis));
    localStorage.setItem('dashboard_main_widgets', JSON.stringify(latestMain));
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

  const mergedMetrics = {
    ...(kpisQuery.data ?? {}),
    ...(additionalMetricsQuery.data ?? {}),
  };

  const renderWidget = (id: string, isKpiZone: boolean) => {
    const isMetricOrKpi = id.startsWith('kpi-') || id.startsWith('metric-');

    if (isMetricOrKpi) {
      const definition = ALL_METRICS[id as keyof typeof ALL_METRICS];
      if (!definition) return null;

      const Icon = definition.icon;
      const colors = colorStyles[definition.color as keyof typeof colorStyles];
      const rawValue = mergedMetrics[definition.valueKey as keyof typeof mergedMetrics] ?? 0;
      
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
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Mevcut Değer
              </span>
              <div className={`p-2.5 rounded-xl border ${colors}`}>
                <Icon className="w-5 h-5" />
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

    switch (id) {
      case 'trend': {
        const currentSize = isKpiZone ? 'small' : (widgetSizes.trend || 'medium');
        const sizeClass = isKpiZone 
          ? 'col-span-1' 
          : currentSize === 'small' 
            ? 'col-span-1' 
            : currentSize === 'medium' 
              ? 'col-span-1 lg:col-span-2' 
              : 'col-span-1 lg:col-span-3';
        
        return (
          <DashboardWidget
            key={id}
            id={id}
            title="Stok Giriş / Çıkış Hareketi Trendi"
            icon={<Calendar className="w-4 h-4" />}
            size={isKpiZone ? undefined : currentSize}
            onSizeChange={isKpiZone ? undefined : (size) => handleSizeChange('trend', size)}
            className={sizeClass}
            onRemove={() => handleRemoveWidget(id)}
          >
            <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
              <MovementTrendChart data={trendQuery.data} />
            </div>
          </DashboardWidget>
        );
      }
      case 'category': {
        const currentSize = isKpiZone ? 'small' : (widgetSizes.category || 'small');
        const sizeClass = isKpiZone 
          ? 'col-span-1' 
          : currentSize === 'small' 
            ? 'col-span-1' 
            : currentSize === 'medium' 
              ? 'col-span-1 lg:col-span-2' 
              : 'col-span-1 lg:col-span-3';
        
        return (
          <DashboardWidget
            key={id}
            id={id}
            title="Kategori Dağılımı"
            icon={<Layers className="w-4 h-4" />}
            size={isKpiZone ? undefined : currentSize}
            onSizeChange={isKpiZone ? undefined : (size) => handleSizeChange('category', size)}
            className={sizeClass}
            onRemove={() => handleRemoveWidget(id)}
          >
            <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
              <CategoryDistributionChart data={categoryQuery.data} />
            </div>
          </DashboardWidget>
        );
      }
      case 'top-products': {
        const currentSize = isKpiZone ? 'small' : (widgetSizes['top-products'] || 'medium');
        const sizeClass = isKpiZone 
          ? 'col-span-1' 
          : currentSize === 'small' 
            ? 'col-span-1' 
            : currentSize === 'medium' 
              ? 'col-span-1 lg:col-span-2' 
              : 'col-span-1 lg:col-span-3';
        
        return (
          <DashboardWidget
            key={id}
            id={id}
            title="En Aktif Ürünler (Son Stok Hareket Sayıları)"
            icon={<BarChart3 className="w-4 h-4" />}
            size={isKpiZone ? undefined : currentSize}
            onSizeChange={isKpiZone ? undefined : (size) => handleSizeChange('top-products', size)}
            className={sizeClass}
            onRemove={() => handleRemoveWidget(id)}
          >
            <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
              <TopProductsChart data={topProductsQuery.data} />
            </div>
          </DashboardWidget>
        );
      }
      case 'occupancy': {
        const currentSize = isKpiZone ? 'small' : (widgetSizes.occupancy || 'small');
        const sizeClass = isKpiZone 
          ? 'col-span-1' 
          : currentSize === 'small' 
            ? 'col-span-1' 
            : currentSize === 'medium' 
              ? 'col-span-1 lg:col-span-2' 
              : 'col-span-1 lg:col-span-3';
        
        return (
          <DashboardWidget
            key={id}
            id={id}
            title="En Dolu Lokasyonlar (%)"
            icon={<MapPin className="w-4 h-4" />}
            size={isKpiZone ? undefined : currentSize}
            onSizeChange={isKpiZone ? undefined : (size) => handleSizeChange('occupancy', size)}
            className={sizeClass}
            onRemove={() => handleRemoveWidget(id)}
          >
            <div className="w-full text-xs min-h-[300px]" style={{ minHeight: 300, width: '100%' }}>
              <LocationOccupancyChart data={occupancyQuery.data} />
            </div>
          </DashboardWidget>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
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
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all active:scale-95"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all active:scale-95"
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
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-8">
          {/* KPI Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Temel Göstergeler (KPI)
            </h3>
            <SortableContext items={kpiWidgets} strategy={rectSortingStrategy}>
              <DroppableContainer
                id="kpi"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[140px] p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/10 dark:bg-zinc-900/5 transition-colors"
              >
                {kpiWidgets.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
                    <p className="text-xs font-semibold">Gösterge Kartı Bulunmuyor</p>
                    <p className="text-[10px] mt-0.5">Sürükleyip buraya bırakabilir veya yeni widget ekleyebilirsiniz.</p>
                  </div>
                ) : (
                  kpiWidgets.map((id) => renderWidget(id, true))
                )}
              </DroppableContainer>
            </SortableContext>
          </div>

          {/* Main Widgets Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Grafikler & Analitik Paneller
            </h3>
            <SortableContext items={mainWidgets} strategy={rectSortingStrategy}>
              <DroppableContainer
                id="widgets"
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[300px] p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/10 dark:bg-zinc-900/5 transition-colors"
              >
                {mainWidgets.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
                    <p className="text-xs font-semibold">Grafik veya Widget Bulunmuyor</p>
                    <p className="text-[10px] mt-0.5">Sürükleyip buraya bırakabilir veya yeni widget ekleyebilirsiniz.</p>
                  </div>
                ) : (
                  mainWidgets.map((id) => renderWidget(id, false))
                )}
              </DroppableContainer>
            </SortableContext>
          </div>
        </div>
      </DndContext>

      {/* Widget Settings side drawer */}
      <WidgetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        widgetOrder={['trend', 'category', 'top-products', 'occupancy']}
        widgetVisibility={{
          trend: kpiWidgets.includes('trend') || mainWidgets.includes('trend'),
          category: kpiWidgets.includes('category') || mainWidgets.includes('category'),
          'top-products': kpiWidgets.includes('top-products') || mainWidgets.includes('top-products'),
          occupancy: kpiWidgets.includes('occupancy') || mainWidgets.includes('occupancy'),
        }}
        onToggleVisibility={(id) => {
          const isVisible = kpiWidgets.includes(id) || mainWidgets.includes(id);
          if (isVisible) {
            handleRemoveWidget(id);
          } else {
            handleAddWidget(id);
          }
        }}
        onReset={handleResetSettings}
      />

      {/* Widget Ekle Modal */}
      <AddWidgetModal
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        widgetOrder={[...kpiWidgets, ...mainWidgets]}
        onAddWidget={handleAddWidget}
        additionalMetrics={mergedMetrics}
      />
    </div>
  );
}
