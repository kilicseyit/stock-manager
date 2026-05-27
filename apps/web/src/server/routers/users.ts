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
});
