import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DEFAULTS = [
  { templateKey: 'low-stock-alert',  label: 'Düşük Stok Uyarısı',      accentColor: '#ef4444' },
  { templateKey: 'weekly-report',    label: 'Haftalık Stok Raporu',     accentColor: '#4f46e5' },
  { templateKey: 'order-created',    label: 'Sipariş Oluşturuldu',      accentColor: '#22c55e' },
  { templateKey: 'welcome-email',    label: 'Hoş Geldiniz',             accentColor: '#4f46e5' },
];

export const emailTemplateRouter = router({
  getAll: publicProcedure.query(async () => {
    const configs = await prisma.emailTemplateConfig.findMany();
    const configMap = new Map(configs.map((c) => [c.templateKey, c]));

    return DEFAULTS.map((d) => {
      const saved = configMap.get(d.templateKey);
      return saved ?? {
        id: null,
        templateKey: d.templateKey,
        label: d.label,
        accentColor: d.accentColor,
        senderName: 'StockManager',
        footerText: 'StockManager Depo Yönetim Sistemi',
        updatedAt: null,
        updatedBy: null,
      };
    });
  }),

  getOne: publicProcedure
    .input(z.object({ templateKey: z.string() }))
    .query(async ({ input }) => {
      const def = DEFAULTS.find((d) => d.templateKey === input.templateKey);
      if (!def) return null;
      const saved = await prisma.emailTemplateConfig.findUnique({
        where: { templateKey: input.templateKey },
      });
      return saved ?? { ...def, id: null, senderName: 'StockManager', footerText: 'StockManager Depo Yönetim Sistemi', updatedAt: null, updatedBy: null };
    }),

  update: publicProcedure
    .input(
      z.object({
        templateKey: z.string(),
        accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        senderName: z.string().min(1).max(60),
        footerText: z.string().min(1).max(200),
        updatedBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const def = DEFAULTS.find((d) => d.templateKey === input.templateKey);
      if (!def) throw new Error('Geçersiz template key');

      return prisma.emailTemplateConfig.upsert({
        where: { templateKey: input.templateKey },
        create: {
          templateKey: input.templateKey,
          label: def.label,
          accentColor: input.accentColor,
          senderName: input.senderName,
          footerText: input.footerText,
          updatedBy: input.updatedBy,
        },
        update: {
          accentColor: input.accentColor,
          senderName: input.senderName,
          footerText: input.footerText,
          updatedBy: input.updatedBy,
        },
      });
    }),
});
