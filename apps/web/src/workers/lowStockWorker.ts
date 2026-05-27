import { Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { getRedisConnection, LOW_STOCK_QUEUE } from '@/lib/queue';
import { subHours } from 'date-fns';

/**
 * Düşük stok kontrolü iş mantığı.
 * Tüm ürünleri tarar ve quantity <= minStock olanlar için Notification kaydı oluşturur.
 * Geriye oluşturulan bildirim sayısını döner.
 */
export async function runLowStockCheck(): Promise<number> {
  // Tüm stok kalemlerini minStock ile birlikte çek
  const stockItems = await prisma.stockItem.findMany({
    where: {
      product: { minStock: { gt: 0 } },
    },
    include: {
      product: {
        select: { id: true, name: true, sku: true, minStock: true },
      },
    },
  });

  // Düşük stok olanları filtrele
  const lowStockItems = stockItems.filter(
    (item) => item.quantity <= item.product.minStock
  );

  if (lowStockItems.length === 0) {
    console.log('[Worker] Düşük stok kalemi yok.');
    return 0;
  }

  // Bildirim alacak kullanıcıları bul (SUPER_ADMIN ve WAREHOUSE_MANAGER)
  const managers = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'WAREHOUSE_MANAGER'] } },
    select: { id: true },
  });

  if (managers.length === 0) {
    console.log('[Worker] Bildirim alacak yönetici bulunamadı.');
    return 0;
  }

  const cutoff = subHours(new Date(), 24);
  let created = 0;

  for (const item of lowStockItems) {
    for (const manager of managers) {
      // 24 saat içinde aynı ürün için bildirim gönderilmiş mi?
      const existing = await prisma.notification.findFirst({
        where: {
          userId: manager.id,
          type: 'LOW_STOCK',
          metadata: { path: ['productId'], equals: item.productId },
          createdAt: { gte: cutoff },
        },
      });

      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId: manager.id,
          type: 'LOW_STOCK',
          title: 'Düşük Stok Uyarısı',
          body: `${item.product.name} (${item.product.sku}) — Mevcut: ${item.quantity}, Min: ${item.product.minStock}`,
          metadata: {
            productId: item.productId,
            productSku: item.product.sku,
            currentQty: item.quantity,
            minStock: item.product.minStock,
            locationId: item.locationId,
          },
        },
      });
      created++;
    }
  }

  return created;
}

/**
 * Düşük stok worker.
 * Her 5 dakikada bir çalışır, quantity <= minStock olan ürünleri tespit eder.
 */
export function createLowStockWorker() {
  const connection = getRedisConnection();

  const worker = new Worker(
    LOW_STOCK_QUEUE,
    async (job) => {
      console.log(`[Worker] Low stock check başladı — job: ${job.id}`);
      const created = await runLowStockCheck();
      console.log(`[Worker] Low stock check bitti — ${created} bildirim oluşturuldu.`);
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job tamamlandı: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job başarısız: ${job?.id}`, err);
  });

  return worker;
}
