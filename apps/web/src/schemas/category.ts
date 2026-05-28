import { z } from 'zod';
import { sanitizedString } from './sanitize';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı zorunludur').max(100, 'Kategori adı en fazla 100 karakter olabilir').pipe(sanitizedString),
  parentId: z.string().optional(),
});

export const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Kategori adı zorunludur').max(100, 'Kategori adı en fazla 100 karakter olabilir').pipe(sanitizedString),
  parentId: z.string().nullable().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
