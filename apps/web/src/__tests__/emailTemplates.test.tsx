import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { LowStockAlert } from '../lib/email-templates/LowStockAlert';
import { WeeklyReport } from '../lib/email-templates/WeeklyReport';
import { OrderCreated } from '../lib/email-templates/OrderCreated';
import { WelcomeEmail } from '../lib/email-templates/WelcomeEmail';

function html(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

describe('LowStockAlert template', () => {
  const base = { productName: 'Test Ürün', sku: 'TST-001', quantity: 3, minStock: 10 };

  it('renders without error', () => {
    expect(() => html(createElement(LowStockAlert, base))).not.toThrow();
  });

  it('contains product name and SKU', () => {
    const out = html(createElement(LowStockAlert, base));
    expect(out).toContain('Test Ürün');
    expect(out).toContain('TST-001');
  });

  it('shows quantity and minStock', () => {
    const out = html(createElement(LowStockAlert, base));
    expect(out).toContain('>3<');
    expect(out).toContain('>10<');
  });

  it('shows deficit amount', () => {
    const out = html(createElement(LowStockAlert, base));
    expect(out).toContain('7'); // 10 - 3
  });

  it('renders manager name when provided', () => {
    const out = html(createElement(LowStockAlert, { ...base, managerName: 'Ali Veli' }));
    expect(out).toContain('Ali Veli');
  });

  it('omits greeting when no managerName', () => {
    const out = html(createElement(LowStockAlert, base));
    expect(out).not.toContain('Merhaba');
  });
});

describe('WeeklyReport template', () => {
  const base = {
    dateStr: '10.06.2026',
    totalProducts: 50,
    lowStockCount: 5,
    criticalProducts: [
      { name: 'Kritik Ürün', sku: 'KRT-001', totalQty: 2, minStock: 20, unit: 'adet', isLow: true },
    ],
  };

  it('renders without error', () => {
    expect(() => html(createElement(WeeklyReport, base))).not.toThrow();
  });

  it('shows total product count', () => {
    const out = html(createElement(WeeklyReport, base));
    expect(out).toContain('50');
  });

  it('shows critical product count', () => {
    const out = html(createElement(WeeklyReport, base));
    expect(out).toContain('>5<');
  });

  it('shows critical product name and SKU', () => {
    const out = html(createElement(WeeklyReport, base));
    expect(out).toContain('Kritik Ürün');
    expect(out).toContain('KRT-001');
  });

  it('shows date string', () => {
    const out = html(createElement(WeeklyReport, base));
    expect(out).toContain('10.06.2026');
  });

  it('renders with no critical products', () => {
    const out = html(createElement(WeeklyReport, { ...base, lowStockCount: 0, criticalProducts: [] }));
    expect(out).toBeTruthy();
    expect(out).not.toContain('Kritik Stok Ürünleri');
  });
});

describe('OrderCreated template', () => {
  const base = {
    orderNumber: 'PO-2026-0042',
    supplierName: 'ABC Tedarik Ltd.',
    createdByName: 'Mehmet Demir',
    totalItems: 3,
    items: [
      { productName: 'Vida M5', sku: 'VDA-M5', quantity: 100, unit: 'adet' },
      { productName: 'Somun M5', sku: 'SMN-M5', quantity: 100, unit: 'adet' },
    ],
  };

  it('renders without error', () => {
    expect(() => html(createElement(OrderCreated, base))).not.toThrow();
  });

  it('contains order number and supplier', () => {
    const out = html(createElement(OrderCreated, base));
    expect(out).toContain('PO-2026-0042');
    expect(out).toContain('ABC Tedarik Ltd.');
  });

  it('shows all items', () => {
    const out = html(createElement(OrderCreated, base));
    expect(out).toContain('Vida M5');
    expect(out).toContain('Somun M5');
  });

  it('shows created-by name', () => {
    const out = html(createElement(OrderCreated, base));
    expect(out).toContain('Mehmet Demir');
  });

  it('shows expectedDate when provided', () => {
    const out = html(createElement(OrderCreated, { ...base, expectedDate: '20.06.2026' }));
    expect(out).toContain('20.06.2026');
  });

  it('omits expectedDate row when not provided', () => {
    const out = html(createElement(OrderCreated, base));
    expect(out).not.toContain('Beklenen Tarih');
  });
});

describe('WelcomeEmail template', () => {
  it('renders without error', () => {
    expect(() => html(createElement(WelcomeEmail, { name: 'Ayşe', role: 'WAREHOUSE_MANAGER' }))).not.toThrow();
  });

  it('shows user name', () => {
    const out = html(createElement(WelcomeEmail, { name: 'Ayşe', role: 'WAREHOUSE_MANAGER' }));
    expect(out).toContain('Ayşe');
  });

  it('shows localized role for WAREHOUSE_MANAGER', () => {
    const out = html(createElement(WelcomeEmail, { name: 'Ayşe', role: 'WAREHOUSE_MANAGER' }));
    expect(out).toContain('Depo Müdürü');
  });

  it('shows localized role for SUPER_ADMIN', () => {
    const out = html(createElement(WelcomeEmail, { name: 'Admin', role: 'SUPER_ADMIN' }));
    expect(out).toContain('Süper Yönetici');
  });

  it('shows temporary password when provided', () => {
    const out = html(createElement(WelcomeEmail, { name: 'Ayşe', role: 'WAREHOUSE_STAFF', temporaryPassword: 'P@ss1234' }));
    expect(out).toContain('P@ss1234');
    expect(out).toContain('Geçici şifreniz');
  });

  it('does not show password section when omitted', () => {
    const out = html(createElement(WelcomeEmail, { name: 'Ayşe', role: 'WAREHOUSE_STAFF' }));
    expect(out).not.toContain('Geçici şifreniz');
  });

  it('handles unknown role gracefully', () => {
    const out = html(createElement(WelcomeEmail, { name: 'Test', role: 'UNKNOWN_ROLE' }));
    expect(out).toContain('UNKNOWN_ROLE');
  });
});
