import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import {
  createLocationSchema,
  updateLocationSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
} from '@/schemas/location';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const locationRouter = router({
  /** Tüm lokasyonlar (warehouse dahil) */
  getAll: publicProcedure.query(async () => {
    return prisma.location.findMany({
      include: {
        warehouse: { select: { id: true, name: true } },
        _count: { select: { stockItems: true } },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { zone: 'asc' }, { aisle: 'asc' }],
    });
  }),

  /** Tek lokasyon detay + stok kalemleri */
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const location = await prisma.location.findUnique({
        where: { id: input.id },
        include: {
          warehouse: true,
          stockItems: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, minStock: true, maxStock: true, unit: true },
              },
            },
            orderBy: { product: { name: 'asc' } },
          },
        },
      });

      if (!location) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lokasyon bulunamadı.' });
      }

      return location;
    }),

  /** Yeni lokasyon oluştur */
  create: publicProcedure
    .input(createLocationSchema)
    .mutation(async ({ input }) => {
      // Depo var mı kontrol et
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: input.warehouseId },
      });
      if (!warehouse) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Depo bulunamadı.' });
      }

      return prisma.location.create({
        data: {
          warehouseId: input.warehouseId,
          zone: input.zone,
          aisle: input.aisle ?? null,
          shelf: input.shelf ?? null,
          bin: input.bin ?? null,
        },
        include: {
          warehouse: { select: { id: true, name: true } },
        },
      });
    }),

  /** Lokasyon güncelle */
  update: publicProcedure
    .input(updateLocationSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const existing = await prisma.location.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lokasyon bulunamadı.' });
      }

      const updateData: Record<string, unknown> = {};
      if (data.zone !== undefined) updateData.zone = data.zone;
      if (data.aisle !== undefined) updateData.aisle = data.aisle;
      if (data.shelf !== undefined) updateData.shelf = data.shelf;
      if (data.bin !== undefined) updateData.bin = data.bin;

      return prisma.location.update({
        where: { id },
        data: updateData,
        include: {
          warehouse: { select: { id: true, name: true } },
        },
      });
    }),

  /** Lokasyon sil (stok varsa hata) */
  delete: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const stockCount = await prisma.stockItem.count({
        where: { locationId: input.id },
      });

      if (stockCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bu lokasyonda ${stockCount} stok kalemi var. Önce stokları taşıyın.`,
        });
      }

      // Stok hareket referansları kontrol et
      const movementCount = await prisma.stockMovement.count({
        where: {
          OR: [
            { fromLocationId: input.id },
            { toLocationId: input.id },
          ],
        },
      });

      if (movementCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bu lokasyonun ${movementCount} stok hareketi kaydı var. Geçmişi olan lokasyonlar silinemez.`,
        });
      }

      return prisma.location.delete({ where: { id: input.id } });
    }),

  /** Toplu lokasyon sil */
  deleteMany: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      let successCount = 0;
      let errorCount = 0;

      for (const id of input.ids) {
        const stockCount = await prisma.stockItem.count({
          where: { locationId: id, quantity: { gt: 0 } },
        });

        const movementCount = await prisma.stockMovement.count({
          where: {
            OR: [
              { fromLocationId: id },
              { toLocationId: id },
            ],
          },
        });

        if (stockCount > 0 || movementCount > 0) {
          errorCount++;
          continue;
        }

        // Sıfır miktarlı stockItem'ları sil
        await prisma.stockItem.deleteMany({ where: { locationId: id } });
        await prisma.location.delete({ where: { id } });
        successCount++;
      }

      return { successCount, errorCount };
    }),

  // --- Depo (Warehouse) ---

  /** Tüm depolar */
  getWarehouses: publicProcedure.query(async () => {
    return prisma.warehouse.findMany({
      include: {
        _count: { select: { locations: true, users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }),

  /** Yeni depo oluştur */
  createWarehouse: publicProcedure
    .input(createWarehouseSchema)
    .mutation(async ({ input }) => {
      return prisma.warehouse.create({
        data: {
          name: input.name,
          address: input.address ?? null,
          timezone: input.timezone,
        },
      });
    }),

  /** Depo güncelle */
  updateWarehouse: publicProcedure
    .input(updateWarehouseSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const existing = await prisma.warehouse.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Depo bulunamadı.' });
      }

      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.timezone !== undefined) updateData.timezone = data.timezone;

      return prisma.warehouse.update({
        where: { id },
        data: updateData,
      });
    }),

  /** Depo sil */
  deleteWarehouse: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const locationCount = await prisma.location.count({
        where: { warehouseId: input.id },
      });

      if (locationCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bu depoya bağlı ${locationCount} adet lokasyon bulunuyor. Lokasyonları silmeden depo silinemez.`,
        });
      }

      const userCount = await prisma.user.count({
        where: { warehouseId: input.id },
      });

      if (userCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bu depoda görevli ${userCount} kullanıcı bulunuyor. Kullanıcıları güncellemeden depo silinemez.`,
        });
      }

      return prisma.warehouse.delete({ where: { id: input.id } });
    }),
});
