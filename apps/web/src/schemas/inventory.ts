import { z } from 'zod';

/** Stok hareket tipleri */
export const movementTypeEnum = z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']);

/** Yeni stok hareketi oluşturma */
export const createMovementSchema = z.object({
  type: movementTypeEnum,
  productId: z.string().min(1, 'Ürün seçimi zorunludur'),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  quantity: z.number().int().positive('Miktar pozitif olmalıdır'),
  reason: z.string().optional(),
}).refine(
  (data) => {
    // OUT ve TRANSFER için fromLocation zorunlu
    if (data.type === 'OUT' || data.type === 'TRANSFER') {
      return !!data.fromLocationId;
    }
    return true;
  },
  { message: 'Çıkış hareketi için kaynak lokasyon zorunludur', path: ['fromLocationId'] }
).refine(
  (data) => {
    // IN ve TRANSFER için toLocation zorunlu
    if (data.type === 'IN' || data.type === 'TRANSFER') {
      return !!data.toLocationId;
    }
    return true;
  },
  { message: 'Giriş hareketi için hedef lokasyon zorunludur', path: ['toLocationId'] }
).refine(
  (data) => {
    // TRANSFER'da from ve to farklı olmalı
    if (data.type === 'TRANSFER') {
      return data.fromLocationId !== data.toLocationId;
    }
    return true;
  },
  { message: 'Kaynak ve hedef lokasyon aynı olamaz', path: ['toLocationId'] }
);

/** Stok hareket geçmişi filtresi */
export const movementFilterSchema = z.object({
  productId: z.string().optional(),
  locationId: z.string().optional(),
  type: movementTypeEnum.optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

/** Stok rezervasyonu */
export const reserveStockSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi zorunludur'),
  locationId: z.string().min(1, 'Lokasyon seçimi zorunludur'),
  quantity: z.number().int().positive('Miktar pozitif olmalıdır'),
});

/** Rezervasyon iptali */
export const releaseReservationSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi zorunludur'),
  locationId: z.string().min(1, 'Lokasyon seçimi zorunludur'),
  quantity: z.number().int().positive('Miktar pozitif olmalıdır'),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type MovementFilterInput = z.infer<typeof movementFilterSchema>;
export type ReserveStockInput = z.infer<typeof reserveStockSchema>;
export type ReleaseReservationInput = z.infer<typeof releaseReservationSchema>;
