import 'dotenv/config';
import { createLowStockWorker } from './lowStockWorker';
import { scheduleLowStockCheck } from '@/lib/queue';

console.log('[Worker] StockManager worker başlatılıyor...');

// Worker'ı başlat
createLowStockWorker();

// Repeat job'ı planla
scheduleLowStockCheck().then(() => {
  console.log('[Worker] Hazır. Ctrl+C ile durdurun.');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM alındı, kapatılıyor...');
  process.exit(0);
});
