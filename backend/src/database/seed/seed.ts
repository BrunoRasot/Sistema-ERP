if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_INSECURE_TLS === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
import { PrismaClient, Role, EntityStatus, UnitOfMeasure, CustomerType, LoyaltyTier } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required to run database seeds.');
}

const cleanConnectionString = connectionString.replace(/[\?&]sslmode=[^&]+/g, '');
const isLocalhost = cleanConnectionString.includes('localhost') || cleanConnectionString.includes('127.0.0.1');
const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Inicializando datos maestros de producción para Vivelite (Únicamente Administrador)...');

  // 1. Único usuario administrador del sistema
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin123!', saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vivelite.pe' },
    update: {},
    create: {
      email: 'admin@vivelite.pe',
      password: adminPassword,
      firstName: 'Administrador',
      lastName: 'Principal',
      phone: '+51 956 123 456',
      role: Role.SUPER_ADMIN,
      status: EntityStatus.ACTIVE,
    },
  });

  console.log(`Usuario único administrador verificado: ${admin.email} [${admin.role}]`);

  // 2. Categorías oficiales
  const catAgua = await prisma.category.upsert({
    where: { name: 'Agua Purificada' },
    update: {},
    create: {
      name: 'Agua Purificada',
      description: 'Línea de agua de mesa purificada y ozonizada',
    },
  });

  const catAccesorios = await prisma.category.upsert({
    where: { name: 'Accesorios y Dispensadores' },
    update: {},
    create: {
      name: 'Accesorios y Dispensadores',
      description: 'Bombas manuales, dispensadores y caños',
    },
  });

  // 3. Catálogo de productos oficial
  await prisma.product.upsert({
    where: { code: 'AGUA-REC-20L' },
    update: {},
    create: {
      code: 'AGUA-REC-20L',
      name: 'Recarga Bidón 20 Litros',
      description: 'Recarga de agua purificada dejando bidón vacío a cambio',
      categoryId: catAgua.id,
      price: 15.00,
      cost: 4.50,
      unit: UnitOfMeasure.BIDON_20L,
      stock: 100,
      minStock: 20,
      isReturnable: true,
    },
  });

  await prisma.product.upsert({
    where: { code: 'AGUA-NUEVO-20L' },
    update: {},
    create: {
      code: 'AGUA-NUEVO-20L',
      name: 'Bidón 20L Nuevo con Agua',
      description: 'Envase retornable nuevo con agua purificada',
      categoryId: catAgua.id,
      price: 45.00,
      cost: 22.00,
      unit: UnitOfMeasure.BIDON_20L,
      stock: 50,
      minStock: 10,
      isReturnable: true,
    },
  });

  await prisma.product.upsert({
    where: { code: 'AGUA-CAJA-20L' },
    update: {},
    create: {
      code: 'AGUA-CAJA-20L',
      name: 'Caja de Agua 20 Litros Descartable',
      description: 'Caja desechable con bolsa y caño vertedor',
      categoryId: catAgua.id,
      price: 25.00,
      cost: 11.00,
      unit: UnitOfMeasure.CAJA,
      stock: 40,
      minStock: 10,
      isReturnable: false,
    },
  });

  await prisma.product.upsert({
    where: { code: 'DISP-BOMBA-ELEC' },
    update: {},
    create: {
      code: 'DISP-BOMBA-ELEC',
      name: 'Bomba Eléctrica USB para Bidón',
      description: 'Dispensador automático de agua recargable USB',
      categoryId: catAccesorios.id,
      price: 35.00,
      cost: 16.00,
      unit: UnitOfMeasure.UNIDAD,
      stock: 20,
      minStock: 5,
      isReturnable: false,
    },
  });

  // 4. Caja física de atención
  await prisma.cashRegister.upsert({
    where: { name: 'Caja Principal Guadalupe' },
    update: {},
    create: {
      name: 'Caja Principal Guadalupe',
      status: EntityStatus.ACTIVE,
    },
  });

  // 5. Cliente genérico para ventas rápidas de mostrador
  await prisma.customer.upsert({
    where: { documentNumber: '00000000' },
    update: {},
    create: {
      documentType: 'DNI',
      documentNumber: '00000000',
      name: 'Clientes Varios / Mostrador',
      phone: '000000000',
      address: 'Venta Directa Mostrador',
      subchannel: 'MOSTRADOR',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.BRONCE,
      bottlesHolding: 0,
      creditLimit: 0.00,
      currentDebt: 0.00,
      status: EntityStatus.ACTIVE,
    },
  });

  console.log('Inicialización de producción finalizada con éxito (Cero datos simulados).');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar seed de producción:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
