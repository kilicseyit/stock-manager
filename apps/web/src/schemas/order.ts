import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, 'Ürün seçilmelidir'),
  orderedQty: z.number().int().positive('Miktar sıfırdan büyük olmalıdır'),
  unitPrice: z.number().nonnegative('Birim fiyat sıfır veya daha büyük olmalıdır'),
});

export const createOrderSchema = z.object({
  supplierId: z.string().min(1, 'Tedarikçi seçilmelidir'),
  items: z.array(orderItemInputSchema).min(1, 'En az bir sipariş kalemi eklenmelidir'),
});

export const updateOrderStatusSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(OrderStatus),
});

export const receiveItemInputSchema = z.object({
  productId: z.string().min(1),
  receivedQty: z.number().int().nonnegative('Kabul miktarı negatif olamaz'),
  locationId: z.string().min(1, 'Kabul lokasyonu seçilmelidir'), // Lokasyon seçimi zorunlu
});

export const receiveOrderItemsSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(receiveItemInputSchema).min(1, 'En az bir kalemin mal kabulü yapılmalıdır'),
});

export const orderFilterSchema = z.object({
  supplierId: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ReceiveItemInput = z.infer<typeof receiveItemInputSchema>;
export type ReceiveOrderItemsInput = z.infer<typeof receiveOrderItemsSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
