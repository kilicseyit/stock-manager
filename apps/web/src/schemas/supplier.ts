import { z } from 'zod';
import { sanitizedString } from './sanitize';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Tedarikçi adı zorunludur').max(200, 'Tedarikçi adı en fazla 200 karakter olabilir').pipe(sanitizedString),
  contactName: sanitizedString.optional().nullable(),
  email: z.string().email('Geçersiz e-posta adresi').optional().or(z.literal('')).nullable(), // E-posta doğrulandığı için HTML tag barındıramaz, normal z.string() kalabilir
  phone: sanitizedString.optional().nullable(),
  rating: z.number().min(0, 'Rating en az 0 olmalı').max(5, 'Rating en fazla 5 olmalı').default(0),
});

export const updateSupplierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Tedarikçi adı zorunludur').max(200).pipe(sanitizedString).optional(),
  contactName: sanitizedString.optional().nullable(),
  email: z.string().email('Geçersiz e-posta adresi').optional().or(z.literal('')).nullable(),
  phone: sanitizedString.optional().nullable(),
  rating: z.number().min(0).max(5).optional(),
});

export const supplierFilterSchema = z.object({
  search: sanitizedString.optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierFilterInput = z.infer<typeof supplierFilterSchema>;
