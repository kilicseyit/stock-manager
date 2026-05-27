import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { createProductSchema, updateProductSchema, productFilterSchema, bulkProductSchema } from '@/schemas/product';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/** SM-XXXXXX formatında sıralı SKU üret */
async function generateSKU(): Promise<string> {
  const lastProduct = await prisma.product.findFirst({
    where: { sku: { startsWith: 'SM-' } },
    orderBy: { sku: 'desc' },
    select: { sku: true },
  });

  let nextNumber = 1;
  if (lastProduct) {
    const numPart = lastProduct.sku.replace('SM-', '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `SM-${nextNumber.toString().padStart(6, '0')}`;
}

export const productRouter = router({
  /** Ürün listesi — cursor-based pagination, ILIKE arama, kategori filtre */
  getAll: publicProcedure
    .input(productFilterSchema)
    .query(async ({ input }) => {
      const { search, categoryId, cursor, limit } = input;

      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const items = await prisma.product.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          category: { select: { id: true, name: true } },
          stockItems: { select: { quantity: true } },
          _count: { select: { stockItems: true } },
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

  /** Tek ürün detay */
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.id },
        include: {
          category: true,
          stockItems: { include: { location: true } },
        },
      });

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ürün bulunamadı.' });
      }

      return product;
    }),

  /** Yeni ürün oluştur (SKU otomatik) */
  create: publicProcedure
    .input(createProductSchema)
    .mutation(async ({ input }) => {
      const sku = await generateSKU();

      // Barkod benzersizlik kontrolü
      if (input.barcode) {
        const existingBarcode = await prisma.product.findUnique({
          where: { barcode: input.barcode },
        });
        if (existingBarcode) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Bu barkod zaten kullanılıyor: ${input.barcode}`,
          });
        }
      }

      return prisma.product.create({
        data: {
          sku,
          name: input.name,
          categoryId: input.categoryId ?? null,
          unit: input.unit,
          barcode: input.barcode ?? null,
          minStock: input.minStock,
          maxStock: input.maxStock ?? null,
          imageUrl: input.imageUrl ?? null,
        },
        include: {
          category: { select: { id: true, name: true } },
        },
      });
    }),

  /** Ürün güncelle */
  update: publicProcedure
    .input(updateProductSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ürün bulunamadı.' });
      }

      // Barkod benzersizlik kontrolü (başka ürüne ait mi)
      if (data.barcode) {
        const existingBarcode = await prisma.product.findUnique({
          where: { barcode: data.barcode },
        });
        if (existingBarcode && existingBarcode.id !== id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Bu barkod zaten kullanılıyor: ${data.barcode}`,
          });
        }
      }

      // undefined alanları hariç tut
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.barcode !== undefined) updateData.barcode = data.barcode;
      if (data.minStock !== undefined) updateData.minStock = data.minStock;
      if (data.maxStock !== undefined) updateData.maxStock = data.maxStock;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

      return prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: { select: { id: true, name: true } },
        },
      });
    }),

  /** Ürün sil */
  delete: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Stok hareketi kontrolü
      const movementCount = await prisma.stockMovement.count({
        where: { productId: input.id },
      });
      if (movementCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bu ürünün ${movementCount} stok hareketi kaydı var. Stok geçmişi olan ürünler silinemez.`,
        });
      }

      // Stok kalemleri sil
      await prisma.stockItem.deleteMany({ where: { productId: input.id } });

      // Sipariş kalemleri sil
      await prisma.purchaseOrderItem.deleteMany({ where: { productId: input.id } });

      return prisma.product.delete({ where: { id: input.id } });
    }),

  /** Toplu ürün sil */
  deleteMany: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      let successCount = 0;
      let errorCount = 0;

      for (const id of input.ids) {
        const movementCount = await prisma.stockMovement.count({
          where: { productId: id },
        });

        if (movementCount > 0) {
          errorCount++;
          continue;
        }

        await prisma.stockItem.deleteMany({ where: { productId: id } });
        await prisma.purchaseOrderItem.deleteMany({ where: { productId: id } });
        await prisma.product.delete({ where: { id } });
        successCount++;
      }

      return { successCount, errorCount };
    }),

  /** Toplu ürün oluştur (CSV/Excel import) */
  bulkCreate: publicProcedure
    .input(z.object({ products: z.array(bulkProductSchema) }))
    .mutation(async ({ input }) => {
      const results: { index: number; success: boolean; sku?: string; error?: string }[] = [];

      for (let i = 0; i < input.products.length; i++) {
        const row = input.products[i];
        try {
          const sku = await generateSKU();

          // Kategori adıyla eşleştir
          let categoryId: string | null = null;
          if (row.categoryName) {
            const cat = await prisma.category.findFirst({
              where: { name: { equals: row.categoryName, mode: 'insensitive' } },
            });
            categoryId = cat?.id ?? null;
          }

          // Barkod benzersizlik kontrolü
          if (row.barcode) {
            const existing = await prisma.product.findUnique({
              where: { barcode: row.barcode },
            });
            if (existing) {
              results.push({ index: i, success: false, error: `Barkod zaten mevcut: ${row.barcode}` });
              continue;
            }
          }

          await prisma.product.create({
            data: {
              sku,
              name: row.name,
              categoryId,
              unit: row.unit,
              barcode: row.barcode ?? null,
              minStock: row.minStock,
              maxStock: row.maxStock ?? null,
            },
          });

          results.push({ index: i, success: true, sku });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
          results.push({ index: i, success: false, error: message });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      // Sistemde kayıtlı ilk kullanıcıyı alıp logu onun adına kaydet
      const user = await prisma.user.findFirst();
      if (user) {
        await prisma.importLog.create({
          data: {
            userId: user.id,
            type: 'PRODUCT',
            totalRows: input.products.length,
            successRows: successCount,
            errorRows: errorCount,
          },
        });
      }

      return { results, successCount, errorCount };
    }),
});
