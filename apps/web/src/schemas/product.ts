import { z } from 'zod';
import { sanitizedString } from './sanitize';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı zorunludur').max(200, 'Ürün adı en fazla 200 karakter olabilir').pipe(sanitizedString),
  categoryId: z.string().optional(),
  unit: sanitizedString.default('adet'),
  barcode: sanitizedString.optional(),
  minStock: z.number().int().min(0, 'Minimum stok 0 veya üzeri olmalı').default(0),
  maxStock: z.number().int().min(0, 'Maksimum stok 0 veya üzeri olmalı').optional(),
  imageUrl: z.string().optional(),
});

export const updateProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Ürün adı zorunludur').max(200).pipe(sanitizedString).optional(),
  categoryId: z.string().nullable().optional(),
  unit: sanitizedString.optional(),
  barcode: sanitizedString.nullable().optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

export const productFilterSchema = z.object({
  search: sanitizedString.optional(),
  categoryId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const bulkProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı zorunludur').pipe(sanitizedString),
  categoryName: sanitizedString.optional(),
  unit: sanitizedString.default('adet'),
  barcode: sanitizedString.optional(),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type BulkProductInput = z.infer<typeof bulkProductSchema>;

