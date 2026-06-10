import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { LowStockAlert } from '../src/lib/email-templates/LowStockAlert';
import { WeeklyReport } from '../src/lib/email-templates/WeeklyReport';
import { OrderCreated } from '../src/lib/email-templates/OrderCreated';
import { WelcomeEmail } from '../src/lib/email-templates/WelcomeEmail';

const outDir = join(__dirname, '../.email-preview');
mkdirSync(outDir, { recursive: true });

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

const links = templates.map(({ name, el }) => {
  const body = renderToStaticMarkup(el);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${body}</body></html>`;
  writeFileSync(join(outDir, `${name}.html`), html);
  return `<li><a href="./${name}.html" target="_blank">${name}</a></li>`;
});

writeFileSync(
  join(outDir, 'index.html'),
  `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>body{font-family:sans-serif;padding:40px}li{margin:12px 0}a{font-size:16px}</style>
</head><body>
<h2>Email Template Önizlemeleri</h2><ul>${links.join('')}</ul>
</body></html>`,
);

console.log(`\n✅ ${templates.length} template oluşturuldu → apps/web/.email-preview/index.html\n`);
templates.forEach(({ name }) => console.log(`  • ${name}.html`));
