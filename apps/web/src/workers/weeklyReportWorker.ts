import { Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { getRedisConnection, WEEKLY_REPORT_QUEUE } from '@/lib/queue';
import ExcelJS from 'exceljs';
import { sendWeeklyReport } from '@/lib/email';

export async function runWeeklyReport(): Promise<void> {
  console.log('[WeeklyReportWorker] Haftalık rapor oluşturma işlemi başladı...');

  try {
    // 1. Ürün verilerini stok miktarları ile birlikte çek
    const products = await prisma.product.findMany({
      include: {
        stockItems: {
          include: {
            location: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockManager';
    const worksheet = workbook.addWorksheet('Haftalik Stok Durumu');

    worksheet.columns = [
      { header: 'Ürün Adı', key: 'name', width: 25 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Toplam Miktar', key: 'totalQty', width: 15 },
      { header: 'Kritik Limit (Min)', key: 'minStock', width: 18 },
      { header: 'Birim', key: 'unit', width: 10 },
      { header: 'Lokasyonlar', key: 'locations', width: 35 },
    ];

    products.forEach((p) => {
      const totalQty = p.stockItems.reduce((sum, item) => sum + item.quantity, 0);
      const locations = p.stockItems
        .map((item) => `${item.location.zone}-${item.location.aisle || 'x'}-${item.location.shelf || 'x'}`)
        .join(', ') || 'Yok';

      worksheet.addRow({
        name: p.name,
        sku: p.sku,
        totalQty,
        minStock: p.minStock,
        unit: p.unit,
        locations,
      });
    });

    // Stil Ekle (Header)
    worksheet.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F46E5' },
    };

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

    // 2. E-posta alıcıları (SUPER_ADMIN kullanıcılar)
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { email: true },
    });

    const emails = admins.map((a) => a.email);
    if (emails.length === 0) {
      console.warn('[WeeklyReportWorker] Rapor gönderilecek aktif SUPER_ADMIN bulunamadı.');
      return;
    }

    const dateStr = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const lowStockProducts = products
      .map((p) => {
        const totalQty = p.stockItems.reduce((sum, item) => sum + item.quantity, 0);
        return { name: p.name, sku: p.sku, totalQty, minStock: p.minStock, unit: p.unit, isLow: totalQty <= p.minStock };
      })
      .filter((p) => p.isLow);

    await sendWeeklyReport(
      {
        dateStr,
        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
        criticalProducts: lowStockProducts,
      },
      emails,
      buffer,
    );

    console.log(`[WeeklyReportWorker] Haftalık rapor e-postası gönderildi: ${emails.join(', ')}`);
  } catch (err) {
    console.error('[WeeklyReportWorker] Rapor oluşturma veya e-posta gönderme sırasında hata:', err);
  }
}

export function createWeeklyReportWorker() {
  const connection = getRedisConnection();

  const worker = new Worker(
    WEEKLY_REPORT_QUEUE,
    async (job) => {
      console.log(`[WeeklyReportWorker] Haftalık rapor job'ı başladı — job: ${job.id}`);
      await runWeeklyReport();
      console.log(`[WeeklyReportWorker] Haftalık rapor job'ı bitti — job: ${job.id}`);
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`[WeeklyReportWorker] Job başarıyla tamamlandı: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[WeeklyReportWorker] Job başarısız oldu: ${job?.id}`, err);
  });

  return worker;
}
