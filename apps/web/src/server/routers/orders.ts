import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  receiveOrderItemsSchema,
  orderFilterSchema,
} from '@/schemas/order';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const orderRouter = router({
  /** Sipariş listesi — filtreleme ve cursor-based pagination */
  getAll: publicProcedure
    .input(orderFilterSchema)
    .query(async ({ input }) => {
      const { supplierId, status, cursor, limit } = input;

      const where: Record<string, unknown> = {};

      if (supplierId) {
        where.supplierId = supplierId;
      }

      if (status) {
        where.status = status;
      }

      const items = await prisma.purchaseOrder.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          supplier: {
            select: { id: true, name: true },
          },
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
          _count: { select: { items: true } },
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

  /** Sipariş detayları */
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const order = await prisma.purchaseOrder.findUnique({
        where: { id: input.id },
        include: {
          supplier: true,
          items: {
            include: {
              product: {
                select: { name: true, sku: true, barcode: true },
              },
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sipariş bulunamadı.' });
      }

      return order;
    }),

  /** Yeni satın alma siparişi oluştur (DRAFT olarak) */
  create: publicProcedure
    .input(createOrderSchema)
    .mutation(async ({ input }) => {
      const { supplierId, items } = input;

      // Tedarikçi kontrolü
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tedarikçi bulunamadı.' });
      }

      return prisma.purchaseOrder.create({
        data: {
          supplierId,
          status: 'DRAFT',
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              orderedQty: item.orderedQty,
              unitPrice: item.unitPrice,
              receivedQty: 0,
            })),
          },
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
        },
      });
    }),

  /** Sipariş durumunu güncelle (DRAFT -> SENT vb.) */
  updateStatus: publicProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ input }) => {
      const { id, status } = input;

      const order = await prisma.purchaseOrder.findUnique({
        where: { id },
      });

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sipariş bulunamadı.' });
      }

      // İptal edilmiş veya tamamlanmış siparişlerin durumu değiştirilemez
      if (order.status === 'CANCELLED' || order.status === 'RECEIVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Tamamlanmış veya iptal edilmiş siparişlerin durumu güncellenemez. Mevcut Durum: ${order.status}`,
        });
      }

      return prisma.purchaseOrder.update({
        where: { id },
        data: { status },
        include: {
          supplier: true,
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
        },
      });
    }),

  /** Mal kabul prosedürü — Barkodlu / Manuel ve zorunlu lokasyonlu */
  receiveItems: publicProcedure
    .input(receiveOrderItemsSchema)
    .mutation(async ({ input }) => {
      const { orderId, items } = input;

      // 1. Siparişi kontrol et
      const order = await prisma.purchaseOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sipariş bulunamadı.' });
      }

      if (order.status === 'DRAFT' || order.status === 'CANCELLED' || order.status === 'RECEIVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bu sipariş durumunda mal kabul yapılamaz. Durum: ${order.status}`,
        });
      }

      // Sistemde kullanıcı bul (stok hareketiyle ilişkilendirmek için)
      const user = await prisma.user.findFirst();
      if (!user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Sistemde kullanıcı bulunamadı. Stok hareketi kaydedilemiyor.',
        });
      }
      const userId = user.id;

      try {
        const updatedOrder = await prisma.$transaction(async (tx) => {
          // Her kabul kalemi için işlem yap
          for (const item of items) {
            if (item.receivedQty <= 0) continue; // Sadece kabul edilen miktarı 0'dan büyük olanları işle

            const orderItem = order.items.find((oi) => oi.productId === item.productId);
            if (!orderItem) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Sipariş kalemleri arasında ürün bulunamadı: ${item.productId}`,
              });
            }

            // Kalan kabul edilebilir miktarı doğrula (sipariş edilenden fazla kabul yapılamaz)
            const remainingQty = orderItem.orderedQty - orderItem.receivedQty;
            if (item.receivedQty > remainingQty) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Girilen kabul miktarı (${item.receivedQty}), kalan sipariş miktarını (${remainingQty}) aşamaz.`,
              });
            }

            // PurchaseOrderItem'daki receivedQty alanını güncelle
            const newReceivedQty = orderItem.receivedQty + item.receivedQty;
            await tx.purchaseOrderItem.update({
              where: { id: orderItem.id },
              data: { receivedQty: newReceivedQty },
            });

            // StockItem tablosunu güncelle veya oluştur (Seçilen lokasyona envanter girişi)
            await tx.stockItem.upsert({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: item.locationId,
                },
              },
              update: {
                quantity: { increment: item.receivedQty },
              },
              create: {
                productId: item.productId,
                locationId: item.locationId,
                quantity: item.receivedQty,
                reservedQty: 0,
              },
            });

            // StockMovement (Stok Hareketi) logu oluştur
            await tx.stockMovement.create({
              data: {
                type: 'IN',
                productId: item.productId,
                toLocationId: item.locationId,
                quantity: item.receivedQty,
                userId: userId,
                reason: `Satın Alma Sipariş Kabulü (Sipariş No: ${orderId})`,
              },
            });
          }

          // Sipariş kalemlerinin son halini çekip sipariş durumunu yeniden belirle
          const updatedItems = await tx.purchaseOrderItem.findMany({
            where: { orderId },
          });

          let allReceived = true;
          let anyReceived = false;

          for (const ui of updatedItems) {
            if (ui.receivedQty < ui.orderedQty) {
              allReceived = false;
            }
            if (ui.receivedQty > 0) {
              anyReceived = true;
            }
          }

          let newStatus: 'RECEIVED' | 'PARTIAL' | 'SENT' = 'SENT';
          if (allReceived) {
            newStatus = 'RECEIVED';
          } else if (anyReceived) {
            newStatus = 'PARTIAL';
          }

          // Sipariş durumunu güncelle
          return tx.purchaseOrder.update({
            where: { id: orderId },
            data: { status: newStatus },
            include: {
              supplier: true,
              items: {
                include: {
                  product: {
                    select: { name: true, sku: true },
                  },
                },
              },
            },
          });
        });

        return { success: true, order: updatedOrder };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Mal kabul işlemi sırasında beklenmedik hata oluştu.',
          cause: err,
        });
      }
    }),
});
