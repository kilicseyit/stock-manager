import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const notificationRouter = router({
  /**
   * Kullanıcıya ait bildirimler — okunmamış önce, cursor-based pagination.
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
        userId: z.string().optional(), // Opsiyonel — ilerleyen fazda session'dan alınır
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, userId } = input;

      // Geçici: ilk user'ı al (ileride session'dan gelecek)
      const user = userId
        ? await prisma.user.findUnique({ where: { id: userId } })
        : await prisma.user.findFirst();

      if (!user) {
        return { items: [], nextCursor: undefined };
      }

      const items = await prisma.notification.findMany({
        where: { userId: user.id },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [
          { isRead: 'asc' }, // Okunmamış önce
          { createdAt: 'desc' },
        ],
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next?.id;
      }

      return { items, nextCursor };
    }),

  /** Okunmamış bildirim sayısı */
  getUnreadCount: publicProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const user = input?.userId
        ? await prisma.user.findUnique({ where: { id: input.userId } })
        : await prisma.user.findFirst();

      if (!user) return { count: 0 };

      const count = await prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });

      return { count };
    }),

  /** Bildirimi okundu işaretle */
  markAsRead: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const notification = await prisma.notification.findUnique({
        where: { id: input.id },
      });
      if (!notification) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Bildirim bulunamadı.' });
      }
      return prisma.notification.update({
        where: { id: input.id },
        data: { isRead: true },
      });
    }),

  /** Tüm bildirimleri okundu işaretle */
  markAllAsRead: publicProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .mutation(async ({ input }) => {
      const user = input?.userId
        ? await prisma.user.findUnique({ where: { id: input.userId } })
        : await prisma.user.findFirst();

      if (!user) return { count: 0 };

      const result = await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return { count: result.count };
    }),
});
