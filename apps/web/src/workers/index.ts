import 'dotenv/config';
import { createLowStockWorker } from './lowStockWorker';
import { createWeeklyReportWorker } from './weeklyReportWorker';
import { scheduleLowStockCheck, scheduleWeeklyReport } from '@/lib/queue';

console.log('[Worker] StockManager worker başlatılıyor...');

// Worker'ları başlat
createLowStockWorker();
createWeeklyReportWorker();

// Repeat job'ları planla
Promise.all([
  scheduleLowStockCheck(),
  scheduleWeeklyReport()
]).then(() => {
  console.log('[Worker] Tüm planlanmış işler (jobs) kuyruğa eklendi. Worker\'lar hazır.');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM alındı, kapatılıyor...');
  process.exit(0);
});
