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
    const criticalStockCount = stockItemsAll.filter(
      (item) => item.product.minStock > 0 && item.quantity <= item.product.minStock
    ).length;

    return {
      totalProducts,
      totalStockValue: Math.round(totalStockValue * 100) / 100, // virgülden sonra 2 hane
      pendingOrders,
      criticalStockCount,
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
});
