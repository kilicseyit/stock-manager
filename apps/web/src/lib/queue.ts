import '@/lib/env';
import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/** BullMQ ConnectionOptions — URL tabanlı bağlantı */
export function getRedisConnection(): ConnectionOptions {
  return { url: REDIS_URL };
}

// Low stock check queue
export const LOW_STOCK_QUEUE = 'low-stock-check';

export function getLowStockQueue(): Queue {
  const connection = getRedisConnection();
  return new Queue(LOW_STOCK_QUEUE, { connection });
}

/**
 * Her 5 dakikada bir tekrarlayan düşük stok kontrol job'ı ekler.
 * Uygulama başladığında bir kez çağrılır.
 */
export async function scheduleLowStockCheck(): Promise<void> {
  const queue = getLowStockQueue();
  // Aynı repeat job'ı tekrar eklemeyi önle
  const repeatableJobs = await queue.getRepeatableJobs();
  const exists = repeatableJobs.some((j) => j.name === 'check');
  if (!exists) {
    await queue.add(
      'check',
      {},
      {
        repeat: { every: 5 * 60 * 1000 }, // 5 dakika
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );
    console.log('[Queue] Low stock check job scheduled (every 5 min)');
  }
}

// Weekly report queue
export const WEEKLY_REPORT_QUEUE = 'weekly-report-queue';

export function getWeeklyReportQueue(): Queue {
  const connection = getRedisConnection();
  return new Queue(WEEKLY_REPORT_QUEUE, { connection });
}

/**
 * Her Pazartesi sabah 08:00'de çalışan haftalık stok raporu gönderme job'ını ekler.
 */
export async function scheduleWeeklyReport(): Promise<void> {
  const queue = getWeeklyReportQueue();
  const repeatableJobs = await queue.getRepeatableJobs();
  const exists = repeatableJobs.some((j) => j.name === 'weekly');
  if (!exists) {
    await queue.add(
      'weekly',
      {},
      {
        repeat: { pattern: '0 8 * * 1' }, // Pazartesi 08:00 cron deseni
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );
    console.log('[Queue] Weekly report job scheduled (cron: every Monday at 08:00)');
  }
}
