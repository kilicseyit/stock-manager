import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import {
  createMovementSchema,
  movementFilterSchema,
  reserveStockSchema,
  releaseReservationSchema,
} from '@/schemas/inventory';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { broadcastInventoryUpdate } from '@/lib/socket';

export const inventoryRouter = router({
  /**
   * Stok hareketi oluştur — Prisma transaction ile atomik güncelleme.
   * IN: toLocation'a ekle
   * OUT: fromLocation'dan çıkar
   * TRANSFER: fromLocation'dan çıkar + toLocation'a ekle
   * ADJUSTMENT: toLocation'a set et
   */
  create: publicProcedure
    .input(createMovementSchema)
    .mutation(async ({ input }) => {
      const { type, productId, fromLocationId, toLocationId, quantity, reason } = input;

      // Ürün var mı kontrol et
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, minStock: true },
      });
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ürün bulunamadı.' });
      }

      // Kullanıcı ID'si — geçici olarak ilk kullanıcıyı al (veya admin'i)
      const user = await prisma.user.findFirst();
      if (!user) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Sistemde kullanici bulunamadi.' });
      }
      const userId = user.id;

      try {
        const result = await prisma.$transaction(async (tx) => {
          // OUT veya TRANSFER: kaynak lokasyondan düş
          if ((type === 'OUT' || type === 'TRANSFER') && fromLocationId) {
            const fromStock = await tx.stockItem.findUnique({
              where: {
                productId_locationId: { productId, locationId: fromLocationId },
              },
            });

            if (!fromStock || fromStock.quantity < quantity) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Yetersiz stok. Mevcut: ${fromStock?.quantity ?? 0}, İstenen: ${quantity}`,
              });
            }

            // Rezerve edilmiş stok kontrolü
            const availableQty = fromStock.quantity - fromStock.reservedQty;
            if (availableQty < quantity) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Kullanılabilir stok yetersiz. Mevcut: ${fromStock.quantity}, Rezerve: ${fromStock.reservedQty}, Kullanılabilir: ${availableQty}`,
              });
            }

            await tx.stockItem.update({
              where: {
                productId_locationId: { productId, locationId: fromLocationId },
              },
              data: { quantity: { decrement: quantity } },
            });
          }

          // IN veya TRANSFER: hedef lokasyona ekle
          if ((type === 'IN' || type === 'TRANSFER') && toLocationId) {
            await tx.stockItem.upsert({
              where: {
                productId_locationId: { productId, locationId: toLocationId },
              },
              update: { quantity: { increment: quantity } },
              create: {
                productId,
                locationId: toLocationId,
                quantity,
                reservedQty: 0,
              },
            });
          }

          // ADJUSTMENT: Direkt set (toLocation'a)
          if (type === 'ADJUSTMENT' && toLocationId) {
            await tx.stockItem.upsert({
              where: {
                productId_locationId: { productId, locationId: toLocationId },
              },
              update: { quantity },
              create: {
                productId,
                locationId: toLocationId,
                quantity,
                reservedQty: 0,
              },
            });
          }

          // Stok hareketi kaydı oluştur
          const movement = await tx.stockMovement.create({
            data: {
              type,
              productId,
              fromLocationId: fromLocationId ?? null,
              toLocationId: toLocationId ?? null,
              quantity,
              userId,
              reason: reason ?? null,
            },
            include: {
              product: { select: { id: true, name: true, sku: true } },
              fromLocation: { select: { id: true, zone: true, aisle: true, shelf: true } },
              toLocation: { select: { id: true, zone: true, aisle: true, shelf: true } },
            },
          });

          return movement;
        });

        // Socket.io broadcast — real-time güncelleme
        try {
          broadcastInventoryUpdate({
            productId,
            locationId: toLocationId || fromLocationId || '',
            quantity,
            type,
            productName: product.name,
          });
        } catch (socketErr) {
          console.error('Socket.io broadcast hatasi:', socketErr);
        }

        return result;
      } catch (error) {
        console.error('Inventory Create Hatasi:', error);
        throw error;
      }
    }),

  /** Stok hareket geçmişi — cursor-based pagination */
  getHistory: publicProcedure
    .input(movementFilterSchema)
    .query(async ({ input }) => {
      const { productId, locationId, type, cursor, limit } = input;

      const where: Record<string, unknown> = {};

      if (productId) where.productId = productId;
      if (type) where.type = type;
      if (locationId) {
        where.OR = [
          { fromLocationId: locationId },
          { toLocationId: locationId },
        ];
      }

      const items = await prisma.stockMovement.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          product: { select: { id: true, name: true, sku: true } },
          fromLocation: { select: { id: true, zone: true, aisle: true, shelf: true } },
          toLocation: { select: { id: true, zone: true, aisle: true, shelf: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  /** Lokasyon bazlı stok durumu */
  getStock: publicProcedure
    .input(z.object({ productId: z.string().optional() }))
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.productId) where.productId = input.productId;

      const stockItems = await prisma.stockItem.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, minStock: true, maxStock: true, unit: true } },
          location: {
            select: {
              id: true,
              zone: true,
              aisle: true,
              shelf: true,
              bin: true,
              warehouse: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [
          { product: { name: 'asc' } },
          { location: { zone: 'asc' } },
        ],
      });

      return stockItems;
    }),

  /** Stok rezervasyonu — reservedQty artır */
  reserve: publicProcedure
    .input(reserveStockSchema)
    .mutation(async ({ input }) => {
      const { productId, locationId, quantity } = input;

      const stockItem = await prisma.stockItem.findUnique({
        where: {
          productId_locationId: { productId, locationId },
        },
      });

      if (!stockItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bu lokasyonda stok kalemi bulunamadı.',
        });
      }

      const availableQty = stockItem.quantity - stockItem.reservedQty;
      if (availableQty < quantity) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Yeterli stok yok. Kullanılabilir: ${availableQty}`,
        });
      }

      return prisma.stockItem.update({
        where: {
          productId_locationId: { productId, locationId },
        },
        data: { reservedQty: { increment: quantity } },
      });
    }),

  /** Rezervasyon iptali — reservedQty azalt */
  releaseReservation: publicProcedure
    .input(releaseReservationSchema)
    .mutation(async ({ input }) => {
      const { productId, locationId, quantity } = input;

      const stockItem = await prisma.stockItem.findUnique({
        where: {
          productId_locationId: { productId, locationId },
        },
      });

      if (!stockItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bu lokasyonda stok kalemi bulunamadı.',
        });
      }

      if (stockItem.reservedQty < quantity) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Rezerve miktardan fazla iptal edilemez. Mevcut rezervasyon: ${stockItem.reservedQty}`,
        });
      }

      return prisma.stockItem.update({
        where: {
          productId_locationId: { productId, locationId },
        },
        data: { reservedQty: { decrement: quantity } },
      });
    }),

  /** Dashboard istatistikleri */
  getDashboardStats: publicProcedure
    .query(async () => {
      const [totalProducts, totalMovements, lowStockItems, recentMovements] = await Promise.all([
        prisma.product.count(),
        prisma.stockMovement.count(),
        // Min stok altındaki ürünler
        prisma.stockItem.findMany({
          where: {
            product: {
              minStock: { gt: 0 },
            },
          },
          include: {
            product: { select: { id: true, name: true, sku: true, minStock: true, unit: true } },
            location: { select: { id: true, zone: true } },
          },
        }).then((items) =>
          items.filter((item) => item.quantity <= item.product.minStock)
        ),
        // Son 5 hareket
        prisma.stockMovement.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { name: true, sku: true } },
            fromLocation: { select: { zone: true } },
            toLocation: { select: { zone: true } },
            user: { select: { name: true } },
          },
        }),
      ]);

      return {
        totalProducts,
        totalMovements,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.slice(0, 10),
        recentMovements,
      };
    }),

  /** Toplu stok hareketi içe aktarma */
  bulkCreateMovements: publicProcedure
    .input(
      z.object({
        movements: z.array(
          z.object({
            sku: z.string().min(1, 'SKU zorunludur'),
            zone: z.string().min(1, 'Bölge zorunludur'),
            quantity: z.number().int().positive('Miktar pozitif olmalıdır'),
            type: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']),
            reason: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const results: { index: number; success: boolean; error?: string }[] = [];

      const user = await prisma.user.findFirst();
      if (!user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Sistemde kullanıcı bulunamadı.',
        });
      }
      const userId = user.id;

      for (let i = 0; i < input.movements.length; i++) {
        const row = input.movements[i];
        try {
          if (row.type === 'TRANSFER') {
            results.push({
              index: i,
              success: false,
              error: 'Toplu harekette TRANSFER tipi desteklenmemektedir, sadece IN/OUT/ADJUSTMENT kullanın.',
            });
            continue;
          }

          // Ürün bul
          const product = await prisma.product.findUnique({
            where: { sku: row.sku },
          });
          if (!product) {
            results.push({ index: i, success: false, error: `Ürün SKU bulunamadı: ${row.sku}` });
            continue;
          }

          // Lokasyon bul
          const location = await prisma.location.findFirst({
            where: { zone: { equals: row.zone, mode: 'insensitive' } },
          });
          if (!location) {
            results.push({ index: i, success: false, error: `Lokasyon bölgesi (Zone) bulunamadı: ${row.zone}` });
            continue;
          }

          // İşlem tipine göre envanter güncelleme
          if (row.type === 'OUT') {
            const stockItem = await prisma.stockItem.findUnique({
              where: {
                productId_locationId: {
                  productId: product.id,
                  locationId: location.id,
                },
              },
            });
            if (!stockItem || stockItem.quantity < row.quantity) {
              results.push({
                index: i,
                success: false,
                error: `Yetersiz stok. Mevcut: ${stockItem?.quantity ?? 0}, İstenen: ${row.quantity}`,
              });
              continue;
            }

            await txUpdateHelper(product.id, location.id, row.quantity, 'OUT');
          } else if (row.type === 'IN') {
            await txUpdateHelper(product.id, location.id, row.quantity, 'IN');
          } else if (row.type === 'ADJUSTMENT') {
            await txUpdateHelper(product.id, location.id, row.quantity, 'ADJUSTMENT');
          }

          // Stok hareketi kaydı oluştur
          await prisma.stockMovement.create({
            data: {
              type: row.type,
              productId: product.id,
              fromLocationId: row.type === 'OUT' ? location.id : null,
              toLocationId: row.type === 'IN' || row.type === 'ADJUSTMENT' ? location.id : null,
              quantity: row.quantity,
              userId: userId,
              reason: row.reason || 'Toplu İçe Aktarma',
            },
          });

          results.push({ index: i, success: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
          results.push({ index: i, success: false, error: message });
        }
      }

      // Yardımcı stok güncelleme fonksiyonu
      async function txUpdateHelper(productId: string, locationId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT') {
        if (type === 'OUT') {
          await prisma.stockItem.update({
            where: {
              productId_locationId: { productId, locationId },
            },
            data: { quantity: { decrement: quantity } },
          });
        } else if (type === 'IN') {
          await prisma.stockItem.upsert({
            where: {
              productId_locationId: { productId, locationId },
            },
            update: { quantity: { increment: quantity } },
            create: {
              productId,
              locationId,
              quantity,
              reservedQty: 0,
            },
          });
        } else if (type === 'ADJUSTMENT') {
          await prisma.stockItem.upsert({
            where: {
              productId_locationId: { productId, locationId },
            },
            update: { quantity },
            create: {
              productId,
              locationId,
              quantity,
              reservedQty: 0,
            },
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      // ImportLog kaydı oluştur
      await prisma.importLog.create({
        data: {
          userId: userId,
          type: 'MOVEMENT',
          totalRows: input.movements.length,
          successRows: successCount,
          errorRows: errorCount,
        },
      });

      return { results, successCount, errorCount };
    }),
});
