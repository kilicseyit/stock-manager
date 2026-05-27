import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { createSupplierSchema, updateSupplierSchema, supplierFilterSchema } from '@/schemas/supplier';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const supplierRouter = router({
  /** Tedarikçi listesi — cursor-based pagination ve performans metrikleri */
  getAll: publicProcedure
    .input(supplierFilterSchema)
    .query(async ({ input }) => {
      const { search, cursor, limit } = input;

      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const items = await prisma.supplier.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          orders: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      // Her tedarikçi için sipariş istatistiklerini hesapla
      const suppliersWithStats = items.map((supplier) => {
        const totalOrders = supplier.orders.length;
        const completedOrders = supplier.orders.filter(o => o.status === 'RECEIVED').length;
        const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

        return {
          id: supplier.id,
          name: supplier.name,
          contactName: supplier.contactName,
          email: supplier.email,
          phone: supplier.phone,
          rating: supplier.rating,
          createdAt: supplier.createdAt,
          updatedAt: supplier.updatedAt,
          stats: {
            totalOrders,
            completedOrders,
            fulfillmentRate,
          },
        };
      });

      return { items: suppliersWithStats, nextCursor };
    }),

  /** Tek tedarikçi detayları */
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const supplier = await prisma.supplier.findUnique({
        where: { id: input.id },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            include: {
              items: {
                include: {
                  product: {
                    select: { name: true, sku: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!supplier) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tedarikçi bulunamadı.' });
      }

      const totalOrders = supplier.orders.length;
      const completedOrders = supplier.orders.filter(o => o.status === 'RECEIVED').length;
      const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      return {
        ...supplier,
        stats: {
          totalOrders,
          completedOrders,
          fulfillmentRate,
        },
      };
    }),

  /** Yeni tedarikçi oluştur */
  create: publicProcedure
    .input(createSupplierSchema)
    .mutation(async ({ input }) => {
      return prisma.supplier.create({
        data: {
          name: input.name,
          contactName: input.contactName ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          rating: input.rating,
        },
      });
    }),

  /** Tedarikçi güncelle */
  update: publicProcedure
    .input(updateSupplierSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const existing = await prisma.supplier.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tedarikçi bulunamadı.' });
      }

      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.contactName !== undefined) updateData.contactName = data.contactName;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.rating !== undefined) updateData.rating = data.rating;

      return prisma.supplier.update({
        where: { id },
        data: updateData,
      });
    }),

  /** Tedarikçi sil */
  delete: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Tedarikçiye ait sipariş kontrolü
      const orderCount = await prisma.purchaseOrder.count({
        where: { supplierId: input.id },
      });

      if (orderCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bu tedarikçiye ait ${orderCount} adet satın alma siparişi bulunuyor. Sipariş geçmişi olan tedarikçiler silinemez.`,
        });
      }

      return prisma.supplier.delete({ where: { id: input.id } });
    }),
});
