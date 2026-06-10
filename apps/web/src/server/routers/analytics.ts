import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const analyticsRouter = router({
  /** Temel KPI değerleri */
  getKPIs: publicProcedure.query(async () => {
    // 1. Toplam SKU (Ürün) Sayısı
    const totalProducts = await prisma.product.count();

    // 2. Toplam Stok Değeri (Son satın alma birim fiyatı * stok miktarı)
    const stockItems = await prisma.stockItem.findMany({
      select: {
        quantity: true,
        product: {
          select: {
            orderItems: {
              orderBy: { order: { createdAt: 'desc' } },
              take: 1,
              select: { unitPrice: true },
            },
          },
        },
      },
    });

    const totalStockValue = stockItems.reduce((sum, item) => {
      const latestPrice = item.product.orderItems[0]?.unitPrice ?? 15.0; // Fallback varsayılan fiyat 15 TL
      return sum + item.quantity * latestPrice;
    }, 0);

    // 3. Bekleyen Satın Alma Siparişi Sayısı (Gönderildi ve Kısmi Kabul durumları)
    const pendingOrders = await prisma.purchaseOrder.count({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
      },
    });

    // 4. Kritik Stok Sayısı (Stok miktarı minStock seviyesinin altında veya eşit olan ürünler)
    const stockItemsAll = await prisma.stockItem.findMany({
      include: {
        product: {
          select: { minStock: true },
        },
      },
    });
    const criticalStockCount = stockItemsAll.filter((item) => item.quantity === 0).length;
    const lowStockCount = stockItemsAll.filter(
      (item) => item.quantity > 0 && item.product.minStock > 0 && item.quantity <= item.product.minStock
    ).length;

    return {
      totalProducts,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      pendingOrders,
      criticalStockCount,
      lowStockCount,
    };
  }),

  /** Gün bazlı stok hareket trendleri (IN / OUT) */
  getStockMovementTrend: publicProcedure
    .input(
      z.object({
        days: z.number().int().min(7).max(90).default(30),
      })
    )
    .query(async ({ input }) => {
      const { days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const movements = await prisma.stockMovement.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          type: true,
          quantity: true,
          createdAt: true,
        },
      });

      // Günleri önceden oluştur (boş günleri sıfırla doldurmak için)
      const trendMap = new Map<string, { date: string; IN: number; OUT: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        trendMap.set(dateStr, { date: dateStr, IN: 0, OUT: 0 });
      }

      // Verileri eşle
      movements.forEach((m) => {
        const dateStr = new Date(m.createdAt).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
        });
        if (trendMap.has(dateStr)) {
          const current = trendMap.get(dateStr)!;
          if (m.type === 'IN') {
            current.IN += m.quantity;
          } else if (m.type === 'OUT') {
            current.OUT += m.quantity;
          }
        }
      });

      return Array.from(trendMap.values());
    }),

  /** En çok hareket gören (en aktif) 10 ürün */
  getTopProducts: publicProcedure.query(async () => {
    const products = await prisma.product.findMany({
      take: 10,
      include: {
        _count: {
          select: { movements: true },
        },
        stockItems: {
          select: { quantity: true },
        },
      },
      orderBy: {
        movements: {
          _count: 'desc',
        },
      },
    });

    return products.map((p) => {
      const currentStock = p.stockItems.reduce((sum, item) => sum + item.quantity, 0);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        movementCount: p._count.movements,
        stock: currentStock,
      };
    });
  }),

  /** Kategori bazlı ürün dağılımı */
  getCategoryDistribution: publicProcedure.query(async () => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return categories
      .map((c) => ({
        name: c.name,
        value: c._count.products,
      }))
      .filter((c) => c.value > 0); // Sadece ürünü olan kategorileri göster
  }),

  /** Lokasyon bazlı raf doluluk oranları */
  getLocationOccupancy: publicProcedure.query(async () => {
    const locations = await prisma.location.findMany({
      include: {
        stockItems: {
          select: { quantity: true },
        },
        warehouse: {
          select: { name: true },
        },
      },
    });

    const capacityPerLocation = 150; // Varsayılan max raf kapasitesi

    const occupancy = locations.map((loc) => {
      const totalQty = loc.stockItems.reduce((sum, item) => sum + item.quantity, 0);
      const rate = Math.min(100, Math.round((totalQty / capacityPerLocation) * 100));

      return {
        id: loc.id,
        name: `${loc.zone}-${loc.aisle || 'x'}-${loc.shelf || 'x'}-${loc.bin || 'x'}`,
        warehouseName: loc.warehouse.name,
        quantity: totalQty,
        rate,
      };
    });

    // Doluluğa göre sırala ve ilk 10'u döndür
    return occupancy.sort((a, b) => b.rate - a.rate).slice(0, 10);
  }),

  /** RAPOR 1: Stok Durum Raporu */
  getStockStatusReport: publicProcedure.query(async () => {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        stockItems: { select: { quantity: true } },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => {
      const currentStock = p.stockItems.reduce((sum, item) => sum + item.quantity, 0);
      return {
        name: p.name,
        sku: p.sku,
        categoryName: p.category?.name ?? '—',
        unit: p.unit,
        currentStock,
        minStock: p.minStock,
        maxStock: p.maxStock ?? 0,
      };
    });
  }),

  /** RAPOR 2: Stok Hareket Raporu */
  getStockMovementReport: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        type: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']).optional().nullable(),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, type } = input;
      const where: Record<string, any> = {};

      if (type) {
        where.type = type;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          fromLocation: { select: { zone: true, aisle: true, shelf: true, bin: true } },
          toLocation: { select: { zone: true, aisle: true, shelf: true, bin: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return movements.map((m) => ({
        id: m.id,
        createdAt: m.createdAt,
        type: m.type,
        productName: m.product.name,
        productSku: m.product.sku,
        quantity: m.quantity,
        fromLocation: m.fromLocation
          ? `${m.fromLocation.zone}-${m.fromLocation.aisle || 'x'}-${m.fromLocation.shelf || 'x'}-${m.fromLocation.bin || 'x'}`
          : '—',
        toLocation: m.toLocation
          ? `${m.toLocation.zone}-${m.toLocation.aisle || 'x'}-${m.toLocation.shelf || 'x'}-${m.toLocation.bin || 'x'}`
          : '—',
        userName: m.user.name,
        reason: m.reason ?? '—',
      }));
    }),

  /** RAPOR 3: Tedarikçi Performans Raporu */
  getSupplierPerformanceReport: publicProcedure.query(async () => {
    const suppliers = await prisma.supplier.findMany({
      include: {
        orders: {
          include: {
            items: {
              select: {
                orderedQty: true,
                unitPrice: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return suppliers.map((s) => {
      const totalOrders = s.orders.length;
      const completedOrders = s.orders.filter((o) => o.status === 'RECEIVED').length;
      const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      const totalSpent = s.orders.reduce((sum, order) => {
        const orderSum = order.items.reduce(
          (itemSum, item) => itemSum + item.orderedQty * item.unitPrice,
          0
        );
        return sum + orderSum;
      }, 0);

      return {
        name: s.name,
        contactName: s.contactName ?? '—',
        email: s.email ?? '—',
        phone: s.phone ?? '—',
        rating: s.rating,
        totalOrders,
        completedOrders,
        fulfillmentRate,
        totalSpent: Math.round(totalSpent * 100) / 100,
      };
    });
  }),

  /** RAPOR 4: Tüm Ürün/Lokasyon Stok Snapshot Listesi */
  getStockSnapshot: publicProcedure.query(async () => {
    const stockItems = await prisma.stockItem.findMany({
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        location: { select: { zone: true, aisle: true, shelf: true, bin: true } },
      },
      orderBy: [{ product: { name: 'asc' } }, { location: { zone: 'asc' } }],
    });

    return stockItems.map((item) => ({
      productName: item.product.name,
      productSku: item.product.sku,
      location: `${item.location.zone}-${item.location.aisle || 'x'}-${item.location.shelf || 'x'}-${item.location.bin || 'x'}`,
      quantity: item.quantity,
      reservedQty: item.reservedQty,
      unit: item.product.unit,
    }));
  }),

  /** İçe aktarma geçmişi logları */
  getImportLogs: publicProcedure.query(async () => {
    return prisma.importLog.findMany({
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  /** Stok Yaşlandırma Analizi */
  getStockAging: publicProcedure.query(async () => {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        stockItems: { select: { quantity: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    });

    const now = new Date();

    const items = products.map((p) => {
      const currentStock = p.stockItems.reduce((sum, item) => sum + item.quantity, 0);
      const lastMovementDate = p.movements[0]?.createdAt ?? p.createdAt;
      
      const diffTime = Math.max(0, now.getTime() - lastMovementDate.getTime());
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let category: 'active' | 'slow' | 'inactive' | 'dead' = 'active';
      let categoryLabel = 'Aktif';
      let colorClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/20';
      
      if (days > 180) {
        category = 'dead';
        categoryLabel = 'Ölü Stok';
        colorClass = 'bg-rose-50 text-rose-605 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30';
      } else if (days > 90) {
        category = 'inactive';
        categoryLabel = 'Hareketsiz';
        colorClass = 'bg-orange-50 text-orange-605 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/30';
      } else if (days > 30) {
        category = 'slow';
        categoryLabel = 'Yavaş';
        colorClass = 'bg-amber-50 text-amber-605 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30';
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryName: p.category?.name ?? '—',
        currentStock,
        lastMovementDate,
        daysWithoutMovement: days,
        category,
        categoryLabel,
        colorClass,
      };
    });

    const summary = {
      active: items.filter(i => i.category === 'active').length,
      slow: items.filter(i => i.category === 'slow').length,
      inactive: items.filter(i => i.category === 'inactive').length,
      dead: items.filter(i => i.category === 'dead').length,
    };

    return {
      items,
      summary,
    };
  }),

  /** ABC/XYZ Envanter Sınıflandırma Analizi */
  getAbcXyzAnalysis: publicProcedure.query(async () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        stockItems: { select: { quantity: true } },
        orderItems: {
          orderBy: { order: { createdAt: 'desc' } },
          take: 1,
          select: { unitPrice: true },
        },
        movements: {
          where: { type: 'OUT', createdAt: { gte: ninetyDaysAgo } },
          select: { quantity: true, createdAt: true },
        },
      },
    });

    // ABC: son 90 günlük OUT tüketim değeri = miktar × son birim fiyat
    const withValue = products.map((p) => {
      const unitPrice = p.orderItems[0]?.unitPrice ?? 0;
      const totalOutQty = p.movements.reduce((s, m) => s + m.quantity, 0);
      const consumptionValue = totalOutQty * unitPrice;
      const currentStock = p.stockItems.reduce((s, i) => s + i.quantity, 0);
      return { p, unitPrice, totalOutQty, consumptionValue, currentStock };
    });

    const grandTotal = withValue.reduce((s, x) => s + x.consumptionValue, 0);
    const sorted = [...withValue].sort((a, b) => b.consumptionValue - a.consumptionValue);

    let cumulative = 0;
    const abcMap = new Map<string, 'A' | 'B' | 'C'>();
    for (const item of sorted) {
      cumulative += grandTotal > 0 ? item.consumptionValue / grandTotal : 0;
      abcMap.set(item.p.id, cumulative <= 0.7 ? 'A' : cumulative <= 0.9 ? 'B' : 'C');
    }

    // XYZ: 12 haftalık talep varyasyon katsayısı (CV = stddev / mean)
    const xyzResults = products.map((p) => {
      const weeks: number[] = Array(12).fill(0);
      const now = Date.now();
      p.movements.forEach((m) => {
        const weekIdx = Math.min(11, Math.floor((now - new Date(m.createdAt).getTime()) / (7 * 86400000)));
        weeks[weekIdx] += m.quantity;
      });
      const mean = weeks.reduce((s, v) => s + v, 0) / 12;
      if (mean === 0) return { id: p.id, xyz: 'Z' as const };
      const variance = weeks.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / 12;
      const cv = Math.sqrt(variance) / mean;
      return { id: p.id, xyz: cv <= 0.5 ? ('X' as const) : cv <= 1.0 ? ('Y' as const) : ('Z' as const) };
    });
    const xyzMap = new Map(xyzResults.map((r) => [r.id, r.xyz]));

    const items = withValue.map(({ p, unitPrice, totalOutQty, consumptionValue, currentStock }) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      categoryName: p.category?.name ?? '—',
      currentStock,
      unitPrice,
      totalOutQty,
      consumptionValue: Math.round(consumptionValue * 100) / 100,
      abc: abcMap.get(p.id) ?? ('C' as 'A' | 'B' | 'C'),
      xyz: xyzMap.get(p.id) ?? ('Z' as 'X' | 'Y' | 'Z'),
      abcXyz: `${abcMap.get(p.id) ?? 'C'}${xyzMap.get(p.id) ?? 'Z'}`,
    }));

    const summary = {
      A: items.filter((i) => i.abc === 'A').length,
      B: items.filter((i) => i.abc === 'B').length,
      C: items.filter((i) => i.abc === 'C').length,
      X: items.filter((i) => i.xyz === 'X').length,
      Y: items.filter((i) => i.xyz === 'Y').length,
      Z: items.filter((i) => i.xyz === 'Z').length,
    };

    return {
      items: items.sort((a, b) => b.consumptionValue - a.consumptionValue),
      summary,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }),

  /** Panel hazır metrik havuzu için ek KPI metrikleri */
  getAdditionalMetrics: publicProcedure.query(async () => {
    // 1. Toplam Depo Sayısı
    const totalWarehouses = await prisma.warehouse.count();

    // 2. Toplam Lokasyon Sayısı
    const totalLocations = await prisma.location.count();

    // 3. Aktif Tedarikçi Sayısı
    const activeSuppliers = await prisma.supplier.count();

    // 4. Bu Ay Sipariş Sayısı
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const ordersThisMonth = await prisma.purchaseOrder.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    // 5. Bu Ay Stok Girişi (IN)
    const stockInMovements = await prisma.stockMovement.aggregate({
      where: {
        type: 'IN',
        createdAt: { gte: startOfMonth }
      },
      _sum: { quantity: true }
    });
    const stockInThisMonth = stockInMovements._sum.quantity ?? 0;

    // 6. Bu Ay Stok Çıkışı (OUT)
    const stockOutMovements = await prisma.stockMovement.aggregate({
      where: {
        type: 'OUT',
        createdAt: { gte: startOfMonth }
      },
      _sum: { quantity: true }
    });
    const stockOutThisMonth = stockOutMovements._sum.quantity ?? 0;

    // 7. Tamamlanan Sipariş Sayısı
    const completedOrders = await prisma.purchaseOrder.count({
      where: { status: 'RECEIVED' }
    });

    // 8. Bekleyen Sipariş Değeri
    const pendingOrdersList = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['SENT', 'PARTIAL'] }
      },
      include: {
        items: {
          select: {
            orderedQty: true,
            receivedQty: true,
            unitPrice: true
          }
        }
      }
    });

    let pendingOrdersValue = 0;
    pendingOrdersList.forEach(order => {
      order.items.forEach(item => {
        const remainingQty = Math.max(0, item.orderedQty - item.receivedQty);
        pendingOrdersValue += remainingQty * item.unitPrice;
      });
    });

    // 9. En Dolu Lokasyon
    const locations = await prisma.location.findMany({
      include: {
        stockItems: {
          select: { quantity: true },
        },
      },
    });
    const capacityPerLocation = 150;
    let maxOccupancyLoc = 'Yok';
    let maxOccupancyRate = 0;

    locations.forEach(loc => {
      const totalQty = loc.stockItems.reduce((sum, item) => sum + item.quantity, 0);
      const rate = Math.min(100, Math.round((totalQty / capacityPerLocation) * 100));
      if (rate > maxOccupancyRate) {
        maxOccupancyRate = rate;
        maxOccupancyLoc = `${loc.zone}-${loc.aisle || 'x'}-${loc.shelf || 'x'}-${loc.bin || 'x'}`;
      }
    });

    // 10. Toplam Rezerve Stok
    const reservedSum = await prisma.stockItem.aggregate({
      _sum: { reservedQty: true }
    });
    const totalReservedStock = reservedSum._sum.reservedQty ?? 0;

    return {
      totalWarehouses,
      totalLocations,
      activeSuppliers,
      ordersThisMonth,
      stockInThisMonth,
      stockOutThisMonth,
      completedOrders,
      pendingOrdersValue: Math.round(pendingOrdersValue * 100) / 100,
      mostOccupiedLocation: maxOccupancyRate > 0 ? `${maxOccupancyLoc} (%${maxOccupancyRate})` : '—',
      totalReservedStock,
    };
  }),
});
