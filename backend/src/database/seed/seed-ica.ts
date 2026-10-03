import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required to run database seeds.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Sembrando zonas de la Region Ica...');

  await prisma.subChannel.deleteMany();
  await prisma.district.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.bottleCondition.deleteMany();

  const icaZones = [
    {
      name: 'Zona 1 - Ica Centro & Metropolitana',
      districts: [
        'Ica Cercado',
        'La Tinguiña',
        'Parcona',
        'San Juan Bautista',
        'Comatrana / Huacachina',
        'Manzanilla / San Isidro',
      ],
    },
    {
      name: 'Zona 2 - Ica Norte & Salas Guadalupe',
      districts: [
        'Salas - Guadalupe (Centro / Plaza)',
        'Villacurí (Salas)',
        'Expansión Urbana (Guadalupe)',
        'Subtanjalla',
        'Macacona',
        'Santa Cruz de Villacurí / Fundos',
      ],
    },
    {
      name: 'Zona 3 - Ica Sur & Valle',
      districts: [
        'Los Aquijes',
        'Pueblo Nuevo (Ica)',
        'Tate',
        'Pachacútec',
        'Santiago',
        'Ocucaje',
        'Yauca del Rosario',
        'San José de los Molinos',
      ],
    },
    {
      name: 'Zona 4 - Provincia de Pisco',
      districts: [
        'Pisco Cercado',
        'San Andrés',
        'Paracas',
        'Túpac Amaru Inca',
        'San Clemente',
        'Huáncano',
        'Humay',
        'Independencia (Pisco)',
      ],
    },
    {
      name: 'Zona 5 - Provincia de Chincha',
      districts: [
        'Chincha Alta',
        'Chincha Baja',
        'Sunampe',
        'Grocio Prado',
        'Pueblo Nuevo (Chincha)',
        'Alto Larán',
        'El Carmen',
        'Tambo de Mora',
      ],
    },
    {
      name: 'Zona 6 - Provincias de Nasca & Palpa',
      districts: [
        'Nasca Cercado',
        'Vista Alegre',
        'Marcona',
        'Palpa Cercado',
        'Santa Cruz (Palpa)',
        'Río Grande',
      ],
    },
  ];

  const defaultSubchannels = [
    'HOGAR',
    'EMPRESA / AGROEXPORTADORA',
    'BODEGA / MINIMARKET',
    'DELIVERY / RUTA',
    'HOTEL / RESTAURANTE / TURISMO',
    'MOSTRADOR / PLANTA',
    'WHATSAPP',
  ];

  for (const z of icaZones) {
    const zone = await prisma.zone.create({
      data: { name: z.name },
    });
    console.log(`Zona creada: ${zone.name}`);

    for (const distName of z.districts) {
      const district = await prisma.district.create({
        data: {
          name: distName,
          zoneId: zone.id,
        },
      });

      for (const subName of defaultSubchannels.slice(0, 4)) {
        await prisma.subChannel.create({
          data: {
            name: subName,
            districtId: district.id,
          },
        });
      }
    }
  }

  const defaultConditions = [
    { code: 'RECARGA', description: 'Cambio de envase vacío por lleno (Solo líquido)' },
    { code: 'CON_ENVASE_NUEVO', description: 'Venta de agua con envase nuevo incluido' },
    { code: 'PRESTAMO', description: 'Entrega de envase en calidad de préstamo/comodato' },
    { code: 'SIN_ENVASE', description: 'Venta sin intercambio de envase' },
  ];

  for (const c of defaultConditions) {
    await prisma.bottleCondition.create({ data: c });
  }

  const stockCount = await prisma.bottleStock.count();
  if (stockCount === 0) {
    await prisma.bottleStock.create({
      data: {
        productId: 1,
        totalEmpty: 180,
        totalFull: 420,
        threshold: 50,
      },
    });
  }

  console.log('Zonas y distritos de Ica registradas correctamente.');
}

main()
  .catch((e) => {
    console.error('Error sembrando:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
