import { PrismaClient, Role, EntityStatus, UnitOfMeasure, CustomerType, LoyaltyTier } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required to run database seeds.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Inicializando datos maestros y usuarios para Vivelite Ica...');

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin123!', saltRounds);
  const vendedorPassword = await bcrypt.hash('Vendedor123!', saltRounds);
  const repartidorPassword = await bcrypt.hash('Repartidor123!', saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vivelite.pe' },
    update: {},
    create: {
      email: 'admin@vivelite.pe',
      password: adminPassword,
      firstName: 'Administrador',
      lastName: 'Ica',
      phone: '+51 956 123 456',
      role: Role.SUPER_ADMIN,
      status: EntityStatus.ACTIVE,
    },
  });

  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@vivelite.pe' },
    update: {},
    create: {
      email: 'vendedor@vivelite.pe',
      password: vendedorPassword,
      firstName: 'Carlos',
      lastName: 'Guadalupe',
      phone: '+51 956 789 012',
      role: Role.VENDEDOR,
      status: EntityStatus.ACTIVE,
    },
  });

  const repartidor = await prisma.user.upsert({
    where: { email: 'repartidor@vivelite.pe' },
    update: {},
    create: {
      email: 'repartidor@vivelite.pe',
      password: repartidorPassword,
      firstName: 'Jorge',
      lastName: 'Ruta Ica',
      phone: '+51 956 345 678',
      role: Role.REPARTIDOR,
      status: EntityStatus.ACTIVE,
    },
  });

  console.log(`Usuarios creados: Admin (${admin.email}), Vendedor (${vendedor.email})`);

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
      stock: 350,
      minStock: 30,
      isReturnable: true,
    },
  });

  await prisma.product.upsert({
    where: { code: 'AGUA-NUEVO-20L' },
    update: {},
    create: {
      code: 'AGUA-NUEVO-20L',
      name: 'Bidón 20L Nuevo con Agua (Envase + Recarga)',
      description: 'Envase retornable de policarbonato nuevo de 20L con agua de mesa',
      categoryId: catAgua.id,
      price: 45.00,
      cost: 22.00,
      unit: UnitOfMeasure.BIDON_20L,
      stock: 120,
      minStock: 20,
      isReturnable: true,
    },
  });

  await prisma.product.upsert({
    where: { code: 'AGUA-CAJA-20L' },
    update: {},
    create: {
      code: 'AGUA-CAJA-20L',
      name: 'Caja de Agua 20 Litros Descartable',
      description: 'Caja con bolsa y caño vertedor desechable, no requiere envase',
      categoryId: catAgua.id,
      price: 25.00,
      cost: 11.00,
      unit: UnitOfMeasure.CAJA,
      stock: 80,
      minStock: 15,
      isReturnable: false,
    },
  });

  await prisma.product.upsert({
    where: { code: 'DISP-BOMBA-ELEC' },
    update: {},
    create: {
      code: 'DISP-BOMBA-ELEC',
      name: 'Bomba Eléctrica USB para Bidón',
      description: 'Dispensador automático de agua recargable vía USB',
      categoryId: catAccesorios.id,
      price: 35.00,
      cost: 16.00,
      unit: UnitOfMeasure.UNIDAD,
      stock: 45,
      minStock: 10,
      isReturnable: false,
    },
  });

  await prisma.cashRegister.upsert({
    where: { name: 'Caja Principal Guadalupe' },
    update: {},
    create: {
      name: 'Caja Principal Guadalupe',
      status: EntityStatus.ACTIVE,
    },
  });

  await prisma.customer.upsert({
    where: { documentNumber: '45892134' },
    update: {},
    create: {
      documentType: 'DNI',
      documentNumber: '45892134',
      name: 'María Gonzales Silva',
      phone: '956112233',
      whatsapp: '956112233',
      address: 'Av. Principal 124, Salas Guadalupe',
      reference: 'A media cuadra de la Plaza de Armas de Guadalupe',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Salas - Guadalupe (Centro / Plaza)',
      subchannel: 'HOGAR',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.PLATA,
      bottlesHolding: 3,
      creditLimit: 100.00,
      currentDebt: 0.00,
    },
  });

  await prisma.customer.upsert({
    where: { documentNumber: '20601234567' },
    update: {},
    create: {
      documentType: 'RUC',
      documentNumber: '20601234567',
      name: 'Agrícola Don Ricardo S.A.C.',
      businessName: 'Agrícola Don Ricardo S.A.C.',
      phone: '956998877',
      whatsapp: '956998877',
      email: 'compras@agricola.pe',
      address: 'Carretera Panamericana Sur Km 295, Villacurí',
      reference: 'Entrada Fundo Villacurí',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Villacurí (Salas)',
      subchannel: 'EMPRESA / AGROEXPORTADORA',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.ORO,
      bottlesHolding: 25,
      creditLimit: 2500.00,
      currentDebt: 300.00,
    },
  });

  console.log('Seed de datos para Ica finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
