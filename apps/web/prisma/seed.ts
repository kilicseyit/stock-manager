import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Veritabanı temizleme işlemi başlatılıyor...');

  // 1. Önce verileri sil (foreign key sırasına göre)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Depo silinmeden önce kullanıcıların warehouseId referansını temizle
  await prisma.user.updateMany({
    data: { warehouseId: null },
  });

  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();

  // Admin hariç diğer kullanıcıları sil
  await prisma.user.deleteMany({
    where: {
      email: { not: 'admin@test.com' },
    },
  });

  console.log('Veritabanı başarıyla temizlendi.');

  // 2. Yeniden oluştur
  // 1 admin kullanıcı
  const email = 'admin@test.com';
  const password = '123456';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Admin User',
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
    create: {
      email,
      name: 'Admin User',
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('Admin kullanıcısı oluşturuldu:', admin.email);

  // 1 ana depo
  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Ana Depo',
      address: 'İstanbul, Türkiye',
      timezone: 'Europe/Istanbul',
    },
  });
  console.log('Ana depo oluşturuldu:', warehouse.name);

  // Admin kullanıcısını depoya ata
  await prisma.user.update({
    where: { id: admin.id },
    data: { warehouseId: warehouse.id },
  });

  // 5 kategori
  const categoryNames = ['Elektronik', 'Mobilya', 'Kırtasiye', 'Giyim', 'Gıda'];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: { name },
    });
    categories.push(category);
  }
  console.log('Kategoriler oluşturuldu:', categoryNames.join(', '));

  // 10 lokasyon (A-1, A-2, B-1, B-2 gibi mantıklı raf isimleri)
  const locationsData = [
    { zone: 'A', aisle: '1', shelf: '1', bin: 'A' },
    { zone: 'A', aisle: '1', shelf: '2', bin: 'B' },
    { zone: 'A', aisle: '2', shelf: '1', bin: 'A' },
    { zone: 'B', aisle: '1', shelf: '1', bin: 'A' },
    { zone: 'B', aisle: '1', shelf: '2', bin: 'B' },
    { zone: 'B', aisle: '2', shelf: '1', bin: 'A' },
    { zone: 'C', aisle: '1', shelf: '1', bin: 'A' },
    { zone: 'C', aisle: '1', shelf: '2', bin: 'B' },
    { zone: 'D', aisle: '1', shelf: '1', bin: 'A' },
    { zone: 'E', aisle: '1', shelf: '1', bin: 'A' },
  ];
  const locations = [];
  for (const loc of locationsData) {
    const location = await prisma.location.create({
      data: {
        warehouseId: warehouse.id,
        zone: loc.zone,
        aisle: loc.aisle,
        shelf: loc.shelf,
        bin: loc.bin,
      },
    });
    locations.push(location);
  }
  console.log('10 Adet lokasyon oluşturuldu.');

  // 10 ürün (her kategoriden 2 tane, gerçekçi detaylar ve minStock)
  const productsData = [
    { name: 'Akıllı Telefon', sku: 'TEL-001', barcode: '8680000000010', minStock: 5, categoryIndex: 0 },
    { name: 'Kablosuz Kulaklık', sku: 'KUL-002', barcode: '8680000000027', minStock: 10, categoryIndex: 0 },
    { name: 'Çalışma Masası', sku: 'MAS-003', barcode: '8680000000034', minStock: 3, categoryIndex: 1 },
    { name: 'Ofis Koltuğu', sku: 'KOL-004', barcode: '8680000000041', minStock: 4, categoryIndex: 1 },
    { name: 'A4 Kağıt 500\'lü', sku: 'KAG-005', barcode: '8680000000058', minStock: 20, categoryIndex: 2 },
    { name: 'Tükenmez Kalem 10\'lu', sku: 'KAL-006', barcode: '8680000000065', minStock: 15, categoryIndex: 2 },
    { name: 'Pamuklu Tişört', sku: 'TIS-007', barcode: '8680000000072', minStock: 12, categoryIndex: 3 },
    { name: 'Kot Pantolon', sku: 'PAN-008', barcode: '8680000000089', minStock: 8, categoryIndex: 3 },
    { name: 'Sızma Zeytinyağı 1L', sku: 'YAG-009', barcode: '8680000000096', minStock: 6, categoryIndex: 4 },
    { name: 'Türk Kahvesi 100g', sku: 'KAH-010', barcode: '8680000000102', minStock: 25, categoryIndex: 4 },
  ];
  const products = [];
  for (const prod of productsData) {
    const product = await prisma.product.create({
      data: {
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        minStock: prod.minStock,
        categoryId: categories[prod.categoryIndex].id,
        unit: 'adet',
      },
    });
    products.push(product);
  }
  console.log('10 Adet ürün oluşturuldu.');

  // 10 stok kalemi (bazıları düşük stokta)
  const stockQuantities = [3, 15, 2, 10, 50, 8, 30, 5, 20, 12];
  const stockItems = [];
  for (let i = 0; i < 10; i++) {
    const stockItem = await prisma.stockItem.create({
      data: {
        productId: products[i].id,
        locationId: locations[i].id,
        quantity: stockQuantities[i],
        reservedQty: 0,
        batchNumber: `BATCH-${100 + i}`,
      },
    });
    stockItems.push(stockItem);
  }
  console.log('10 Adet stok kalemi oluşturuldu (bazıları düşük stok seviyesinde).');

  // 5 stok hareketi (IN/OUT/TRANSFER/ADJUSTMENT karışık)
  const movementsData = [
    {
      type: 'IN' as const,
      productId: products[0].id,
      toLocationId: locations[0].id,
      quantity: 5,
      reason: 'İlk sayım girişi',
    },
    {
      type: 'OUT' as const,
      productId: products[1].id,
      fromLocationId: locations[1].id,
      quantity: 2,
      reason: 'Müşteri satışı',
    },
    {
      type: 'TRANSFER' as const,
      productId: products[2].id,
      fromLocationId: locations[2].id,
      toLocationId: locations[3].id,
      quantity: 1,
      reason: 'Raf düzenleme',
    },
    {
      type: 'ADJUSTMENT' as const,
      productId: products[3].id,
      toLocationId: locations[3].id,
      quantity: 3,
      reason: 'Envanter düzeltme',
    },
    {
      type: 'IN' as const,
      productId: products[4].id,
      toLocationId: locations[4].id,
      quantity: 10,
      reason: 'Tedarikçiden mal kabul',
    },
  ];

  for (const m of movementsData) {
    await prisma.stockMovement.create({
      data: {
        type: m.type,
        productId: m.productId,
        fromLocationId: m.fromLocationId || null,
        toLocationId: m.toLocationId || null,
        quantity: m.quantity,
        userId: admin.id,
        reason: m.reason,
      },
    });
  }
  console.log('5 Adet stok hareketi oluşturuldu.');
  console.log('Veritabanı seed işlemi başarıyla tamamlandı.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
