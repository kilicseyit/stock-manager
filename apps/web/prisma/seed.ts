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
  const email = 'admin@test.com';
  const password = '123456';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
    },
    create: {
      email,
      name: 'Admin User',
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'default-warehouse' },
    update: {},
    create: {
      id: 'default-warehouse',
      name: 'Ana Depo',
      address: 'İstanbul, Türkiye',
      timezone: 'Europe/Istanbul',
    },
  });

  console.log('Depo oluşturuldu:', warehouse.name);

  console.log('Seed database completed successfully.');
  console.log('Admin user created/updated:', admin.email);
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
