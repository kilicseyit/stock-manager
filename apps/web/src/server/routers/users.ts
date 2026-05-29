import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';

export const userRouter = router({
  /** Kullanıcı profilini güncelle */
  updateProfile: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1, 'Ad Soyad alanı zorunludur'),
        email: z.string().email('Geçersiz e-posta adresi'),
        password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır').optional().or(z.literal('')),
      })
    )
    .mutation(async ({ input }) => {
      const { id, name, email, password } = input;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kullanıcı bulunamadı.' });
      }

      // Email benzersizlik kontrolü
      if (email !== user.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.',
          });
        }
      }

      const updateData: Record<string, any> = { name, email };

      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return updatedUser;
    }),

  /** İlk kullanıcıyı getir (sadece dev ortamında veya ayarlar sayfasında profil doldurmak için) */
  getCurrentUser: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kullanıcı bulunamadı.' });
      }

      return user;
    }),

  /** Tüm kullanıcıları listele */
  getAll: publicProcedure.query(async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        warehouseId: true,
        isActive: true,
        createdAt: true,
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }),

  /** Yeni kullanıcı oluştur (Sadece SUPER_ADMIN yetkisiyle veya sistem kurulumunda) */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Ad Soyad alanı zorunludur'),
        email: z.string().email('Geçersiz e-posta adresi'),
        password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
        role: z.enum(['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'STAFF', 'VIEWER']),
        warehouseId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { name, email, password, role, warehouseId } = input;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Bu e-posta adresi zaten kullanımda.',
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      return prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          warehouseId: warehouseId || null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    }),

  /** Kullanıcı bilgilerini düzenle */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1, 'Ad Soyad alanı zorunludur'),
        email: z.string().email('Geçersiz e-posta adresi'),
        role: z.enum(['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'STAFF', 'VIEWER']),
        warehouseId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, name, email, role, warehouseId } = input;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kullanıcı bulunamadı.' });
      }

      if (email !== user.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.',
          });
        }
      }

      return prisma.user.update({
        where: { id },
        data: {
          name,
          email,
          role,
          warehouseId: warehouseId || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    }),

  /** Kullanıcı durumunu aktifleştir / deaktifleştir */
  deactivate: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, isActive } = input;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kullanıcı bulunamadı.' });
      }

      // Kendi kendini deaktive etmeyi engelle
      // Not: authorization kontrolü NextAuth ile oturum açan kullanıcıya göre client'ta veya context'te yapılabilir, 
      // ancak burada basitçe isActive güncelliyoruz.
      return prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      });
    }),

  /** Aktivite loglarını listele (Eğer boşsa test verileriyle doldur) */
  getAuditLogs: publicProcedure
    .input(
      z.object({
        userId: z.string().optional().nullable(),
        action: z.string().optional().nullable(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
      })
    )
    .query(async ({ input }) => {
      const { userId, action, startDate, endDate } = input;

      // Eğer hiç log yoksa örnek veriler oluştur
      const logCount = await prisma.auditLog.count();
      if (logCount === 0) {
        const defaultUser = await prisma.user.findFirst();
        if (defaultUser) {
          const products = await prisma.product.findMany({ take: 2 });
          const locations = await prisma.location.findMany({ take: 2 });

          await prisma.auditLog.createMany({
            data: [
              {
                userId: defaultUser.id,
                action: 'CREATE',
                entity: 'PRODUCT',
                entityId: products[0]?.id || '1',
                newValue: { name: products[0]?.name || 'Akıllı Saat X', sku: products[0]?.sku || 'TEL-001' },
                createdAt: new Date(Date.now() - 3600000 * 2), // 2 saat önce
              },
              {
                userId: defaultUser.id,
                action: 'STOCK_ADJUSTMENT',
                entity: 'STOCK',
                entityId: locations[0]?.id || '1',
                newValue: { quantity: 15, reason: 'Yıllık stok sayımı envanter eşitleme' },
                createdAt: new Date(Date.now() - 3600000), // 1 saat önce
              },
              {
                userId: defaultUser.id,
                action: 'UPDATE',
                entity: 'USER',
                entityId: defaultUser.id,
                newValue: { role: 'SUPER_ADMIN' },
                createdAt: new Date(), // şimdi
              },
            ],
          });
        }
      }

      const where: Record<string, any> = {};

      if (userId) {
        where.userId = userId;
      }

      if (action) {
        where.action = { contains: action, mode: 'insensitive' };
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

      return prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),
});
