import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { createCategorySchema, updateCategorySchema } from '@/schemas/category';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const categoryRouter = router({
  /** Tüm kategorileri listele (flat list, include children count) */
  getAll: publicProcedure.query(async () => {
    return prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
      orderBy: { name: 'asc' },
    });
  }),

  /** Hiyerarşik ağaç yapısı — sadece root kategoriler + nested children */
  getTree: publicProcedure.query(async () => {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                _count: { select: { products: true } },
              },
            },
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    return categories;
  }),

  /** Yeni kategori oluştur */
  create: publicProcedure
    .input(createCategorySchema)
    .mutation(async ({ input }) => {
      // parentId varsa geçerliliğini kontrol et
      if (input.parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Üst kategori bulunamadı.',
          });
        }
      }

      return prisma.category.create({
        data: {
          name: input.name,
          parentId: input.parentId ?? null,
        },
      });
    }),

  /** Kategori güncelle */
  update: publicProcedure
    .input(updateCategorySchema)
    .mutation(async ({ input }) => {
      const existing = await prisma.category.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Kategori bulunamadı.',
        });
      }

      // Kendi kendine parent olamaz
      if (input.parentId === input.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Bir kategori kendisinin üst kategorisi olamaz.',
        });
      }

      return prisma.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          parentId: input.parentId !== undefined ? input.parentId : existing.parentId,
        },
      });
    }),

  /** Kategori sil */
  delete: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Alt kategorisi varsa silme
      const childCount = await prisma.category.count({
        where: { parentId: input.id },
      });
      if (childCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bu kategorinin ${childCount} alt kategorisi var. Önce alt kategorileri silin.`,
        });
      }

      // Ürün bağlantısını kaldır (null yap)
      await prisma.product.updateMany({
        where: { categoryId: input.id },
        data: { categoryId: null },
      });

      return prisma.category.delete({ where: { id: input.id } });
    }),
});
