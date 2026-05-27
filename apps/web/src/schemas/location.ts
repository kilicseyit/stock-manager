import { z } from 'zod';

/** Yeni lokasyon oluşturma */
export const createLocationSchema = z.object({
  warehouseId: z.string().min(1, 'Depo seçimi zorunludur'),
  zone: z.string().min(1, 'Bölge adı zorunludur'),
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  bin: z.string().optional(),
});

/** Lokasyon güncelleme */
export const updateLocationSchema = z.object({
  id: z.string().min(1),
  zone: z.string().min(1, 'Bölge adı zorunludur').optional(),
  aisle: z.string().nullable().optional(),
  shelf: z.string().nullable().optional(),
  bin: z.string().nullable().optional(),
});

/** Depo oluşturma */
export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Depo adı zorunludur'),
  address: z.string().optional(),
  timezone: z.string().default('Europe/Istanbul'),
});

/** Depo güncelleme */
export const updateWarehouseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Depo adı zorunludur').optional(),
  address: z.string().nullable().optional(),
  timezone: z.string().optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
