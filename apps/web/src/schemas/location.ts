import { z } from 'zod';
import { sanitizedString } from './sanitize';

/** Yeni lokasyon oluşturma */
export const createLocationSchema = z.object({
  warehouseId: z.string().min(1, 'Depo seçimi zorunludur'),
  zone: z.string().min(1, 'Bölge adı zorunludur').pipe(sanitizedString),
  aisle: sanitizedString.optional(),
  shelf: sanitizedString.optional(),
  bin: sanitizedString.optional(),
});

/** Lokasyon güncelleme */
export const updateLocationSchema = z.object({
  id: z.string().min(1),
  zone: z.string().min(1, 'Bölge adı zorunludur').pipe(sanitizedString).optional(),
  aisle: sanitizedString.nullable().optional(),
  shelf: sanitizedString.nullable().optional(),
  bin: sanitizedString.nullable().optional(),
});

/** Depo oluşturma */
export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Depo adı zorunludur').pipe(sanitizedString),
  address: sanitizedString.optional(),
  timezone: sanitizedString.default('Europe/Istanbul'),
});

/** Depo güncelleme */
export const updateWarehouseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Depo adı zorunludur').pipe(sanitizedString).optional(),
  address: sanitizedString.nullable().optional(),
  timezone: sanitizedString.optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
