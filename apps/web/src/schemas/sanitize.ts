import { z } from 'zod';

/**
 * XSS önlemek amacıyla HTML özel karakterlerini kaçış karakterlerine (escape) dönüştürür.
 */
export function escapeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Zod için otomatik kırpılmış (trimmed) ve sanitize edilmiş string şemaları
 */
export const sanitizedString = z.string().trim().transform(escapeString);

export const optionalSanitizedString = z.string().trim().transform(escapeString).optional();

export const nullableSanitizedString = z.string().trim().transform(escapeString).nullable();
