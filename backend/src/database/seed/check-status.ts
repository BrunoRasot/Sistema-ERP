import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required to check status.');
}

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const pool = new Pool({
  connectionString,
  ...(isLocalhost ? {} : { ssl: { rejectUnauthorized: false } }),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total usuarios en BD:', users.length);
  users.forEach((u) => console.log(`- ${u.email} [${u.role}] (Status: ${u.status})`));

  const zones = await prisma.zone.findMany({ include: { districts: true } });
  console.log('Total zonas en BD:', zones.length);
  zones.forEach((z) => console.log(`- ${z.name}: ${z.districts.length} distritos`));
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
