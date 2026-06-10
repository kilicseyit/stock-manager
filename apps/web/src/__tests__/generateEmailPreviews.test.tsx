/**
 * Bu test dosyası çalıştırıldığında .email-preview/ klasörüne HTML dosyaları yazar.
 * `pnpm test -- --testPathPattern=generateEmailPreviews` ile çalıştır.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { LowStockAlert } from '../lib/email-templates/LowStockAlert';
import { WeeklyReport } from '../lib/email-templates/WeeklyReport';
import { OrderCreated } from '../lib/email-templates/OrderCreated';
import { WelcomeEmail } from '../lib/email-templates/WelcomeEmail';

const outDir = join(__dirname, '../../.email-preview');

const templates = [
  {
    name: 'low-stock-alert',
    el: createElement(LowStockAlert, {
      productName: 'Vida M5x20',
      sku: 'VDA-M5-20',
      quantity: 3,
      minStock: 50,
      managerName: 'Ahmet Yılmaz',
    }),
  },
  {
    name: 'weekly-report',
    el: createElement(WeeklyReport, {
      dateStr: '10.06.2026',
      totalProducts: 124,
      lowStockCount: 7,
      criticalProducts: [
        { name: 'Vida M5x20', sku: 'VDA-M5-20', totalQty: 3, minStock: 50, unit: 'adet', isLow: true },
        { name: 'Somun M8', sku: 'SMN-M8', totalQty: 0, minStock: 20, unit: 'adet', isLow: true },
        { name: 'Conta 10mm', sku: 'CNT-10', totalQty: 5, minStock: 30, unit: 'adet', isLow: true },
      ],
    }),
  },
  {
    name: 'order-created',
    el: createElement(OrderCreated, {
      orderNumber: 'PO-2026-0042',
      supplierName: 'ABC Tedarik Ltd.',
      createdByName: 'Mehmet Demir',
      expectedDate: '20.06.2026',
      totalItems: 3,
      items: [
        { productName: 'Vida M5x20', sku: 'VDA-M5-20', quantity: 500, unit: 'adet' },
        { productName: 'Somun M8', sku: 'SMN-M8', quantity: 200, unit: 'adet' },
        { productName: 'Conta 10mm', sku: 'CNT-10', quantity: 300, unit: 'adet' },
      ],
    }),
  },
  {
    name: 'welcome-email',
    el: createElement(WelcomeEmail, {
      name: 'Ayşe Kara',
      role: 'WAREHOUSE_MANAGER',
      temporaryPassword: 'Temp@1234',
    }),
  },
];

describe('Email preview generator', () => {
  it('generates HTML preview files', () => {
    mkdirSync(outDir, { recursive: true });

    const links = templates.map(({ name, el }) => {
      const body = renderToStaticMarkup(el);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;background:#f3f4f6;padding:32px">${body}</body></html>`;
      writeFileSync(join(outDir, `${name}.html`), html);
      return `<li style="margin:12px 0"><a href="./${name}.html" target="_blank" style="font-size:16px;color:#4f46e5">${name}</a></li>`;
    });

    writeFileSync(
      join(outDir, 'index.html'),
      `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>body{font-family:sans-serif;padding:40px;background:#f9fafb}h2{color:#111827}</style>
</head><body>
<h2>📧 Email Template Önizlemeleri</h2>
<ul>${links.join('')}</ul>
</body></html>`,
    );

    expect(true).toBe(true);
    console.log(`\n✅ Önizlemeler hazır: apps/web/.email-preview/index.html`);
  });
});
