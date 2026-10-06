if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_INSECURE_TLS === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
import {
  PrismaClient,
  Role,
  EntityStatus,
  UnitOfMeasure,
  CustomerType,
  LoyaltyTier,
  OrderStatus,
  SaleType,
  PaymentStatus,
  DocumentType,
} from '@prisma/client';
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
  console.log('====================================================');
  console.log('🚀 INICIALIZANDO SEED DE DEMOSTRACIÓN (VIVELITE ERP)');
  console.log('   Generando entorno interactivo realista para portafolio...');
  console.log('====================================================');

  const saltRounds = 10;
  const demoPassword = await bcrypt.hash('Demo123!', saltRounds);

  // 1. USUARIOS DEMO CON DIFERENTES ROLES
  console.log('1. Creando usuarios de demostración...');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: { password: demoPassword, status: EntityStatus.ACTIVE },
    create: {
      email: 'admin@demo.local',
      password: demoPassword,
      firstName: 'Carlos',
      lastName: 'Mendoza (Admin Demo)',
      phone: '+51 956 000 111',
      role: Role.SUPER_ADMIN,
      status: EntityStatus.ACTIVE,
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: 'vendedor@demo.local' },
    update: { password: demoPassword, status: EntityStatus.ACTIVE },
    create: {
      email: 'vendedor@demo.local',
      password: demoPassword,
      firstName: 'Valeria',
      lastName: 'Rios (Ventas Demo)',
      phone: '+51 956 000 222',
      role: Role.VENDEDOR,
      status: EntityStatus.ACTIVE,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: 'cajero@demo.local' },
    update: { password: demoPassword, status: EntityStatus.ACTIVE },
    create: {
      email: 'cajero@demo.local',
      password: demoPassword,
      firstName: 'Diego',
      lastName: 'Navarro (Caja Demo)',
      phone: '+51 956 000 333',
      role: Role.CAJERO,
      status: EntityStatus.ACTIVE,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'repartidor@demo.local' },
    update: { password: demoPassword, status: EntityStatus.ACTIVE },
    create: {
      email: 'repartidor@demo.local',
      password: demoPassword,
      firstName: 'Jorge',
      lastName: 'Quispe (Reparto Demo)',
      phone: '+51 956 000 444',
      role: Role.REPARTIDOR,
      status: EntityStatus.ACTIVE,
    },
  });

  console.log('   ✓ Usuarios creados: admin@demo.local, vendedor@demo.local, cajero@demo.local, repartidor@demo.local');

  // 2. CATEGORÍAS DE PRODUCTOS
  console.log('2. Creando categorías...');
  const catAgua = await prisma.category.upsert({
    where: { name: 'Agua Purificada' },
    update: {},
    create: {
      name: 'Agua Purificada',
      description: 'Línea de agua de mesa purificada y ozonizada en múltiples presentaciones',
    },
  });

  const catAccesorios = await prisma.category.upsert({
    where: { name: 'Accesorios y Dispensadores' },
    update: {},
    create: {
      name: 'Accesorios y Dispensadores',
      description: 'Bombas eléctricas USB, dispensadores de mesa y caños',
    },
  });

  const catBebidas = await prisma.category.upsert({
    where: { name: 'Bebidas e Hidratación' },
    update: {},
    create: {
      name: 'Bebidas e Hidratación',
      description: 'Agua mineral gasificada, bebidas isotónicas y packs familiares',
    },
  });

  // 3. CATÁLOGO DE PRODUCTOS
  console.log('3. Creando catálogo de productos...');
  const prodRecarga20L = await prisma.product.upsert({
    where: { code: 'AGUA-REC-20L' },
    update: { stock: 120, price: 15.00, cost: 4.50 },
    create: {
      code: 'AGUA-REC-20L',
      name: 'Recarga Bidón 20 Litros',
      description: 'Recarga de agua purificada 20L dejando envase vacío en intercambio',
      categoryId: catAgua.id,
      price: 15.00,
      cost: 4.50,
      unit: UnitOfMeasure.BIDON_20L,
      stock: 120,
      minStock: 25,
      isReturnable: true,
      status: EntityStatus.ACTIVE,
    },
  });

  const prodNuevo20L = await prisma.product.upsert({
    where: { code: 'AGUA-NUEVO-20L' },
    update: { stock: 45, price: 45.00, cost: 22.00 },
    create: {
      code: 'AGUA-NUEVO-20L',
      name: 'Bidón 20L Nuevo con Agua',
      description: 'Envase retornable de policarbonato nuevo cargado con agua purificada',
      categoryId: catAgua.id,
      price: 45.00,
      cost: 22.00,
      unit: UnitOfMeasure.BIDON_20L,
      stock: 45,
      minStock: 10,
      isReturnable: true,
      status: EntityStatus.ACTIVE,
    },
  });

  const prodCaja20L = await prisma.product.upsert({
    where: { code: 'AGUA-CAJA-20L' },
    update: { stock: 60, price: 25.00, cost: 11.00 },
    create: {
      code: 'AGUA-CAJA-20L',
      name: 'Caja de Agua 20L Descartable',
      description: 'Caja ecológica desechable con bolsa interna y grifo dosificador',
      categoryId: catAgua.id,
      price: 25.00,
      cost: 11.00,
      unit: UnitOfMeasure.CAJA,
      stock: 60,
      minStock: 15,
      isReturnable: false,
      status: EntityStatus.ACTIVE,
    },
  });

  const prodBombaUSB = await prisma.product.upsert({
    where: { code: 'DISP-BOMBA-USB' },
    update: { stock: 35, price: 35.00, cost: 16.00 },
    create: {
      code: 'DISP-BOMBA-USB',
      name: 'Bomba Eléctrica USB para Bidón',
      description: 'Dispensador automático recargable por USB con batería de litio',
      categoryId: catAccesorios.id,
      price: 35.00,
      cost: 16.00,
      unit: UnitOfMeasure.UNIDAD,
      stock: 35,
      minStock: 8,
      isReturnable: false,
      status: EntityStatus.ACTIVE,
    },
  });

  const prodBidon7L = await prisma.product.upsert({
    where: { code: 'AGUA-PACK-7L' },
    update: { stock: 80, price: 10.00, cost: 3.80 },
    create: {
      code: 'AGUA-PACK-7L',
      name: 'Bidón 7 Litros con Caño',
      description: 'Presentación compacta ideal para departamentos y oficinas pequeñas',
      categoryId: catAgua.id,
      price: 10.00,
      cost: 3.80,
      unit: UnitOfMeasure.UNIDAD,
      stock: 80,
      minStock: 20,
      isReturnable: false,
      status: EntityStatus.ACTIVE,
    },
  });

  // 4. CAJA PRINCIPAL DE ATENCIÓN
  console.log('4. Configurando caja de atención...');
  const cashRegister = await prisma.cashRegister.upsert({
    where: { name: 'Caja Principal Demo' },
    update: {},
    create: {
      name: 'Caja Principal Demo',
      status: EntityStatus.ACTIVE,
    },
  });

  // 5. CLIENTES DEMO REALISTAS (ICA)
  console.log('5. Creando clientes de prueba...');
  const customersData = [
    {
      documentType: DocumentType.RUC,
      documentNumber: '20601234561',
      name: 'Restaurante & Hotel El Huacachinero S.A.C.',
      businessName: 'El Huacachinero Resort',
      email: 'compras@elhuacachinero.demo',
      phone: '+51 956 789 101',
      address: 'Balneario Huacachina 124',
      zone: 'Huacachina',
      district: 'Ica',
      subchannel: 'RESTAURANTES',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.ORO,
      bottlesHolding: 12,
      creditLimit: 1500.00,
      currentDebt: 180.00,
    },
    {
      documentType: DocumentType.RUC,
      documentNumber: '20609876542',
      name: 'Agroexportadora Fundo Los Viñedos E.I.R.L.',
      businessName: 'Fundo Los Viñedos',
      email: 'administracion@losvinedos.demo',
      phone: '+51 956 890 234',
      address: 'Panamericana Sur Km 302, Subtanjalla',
      zone: 'Subtanjalla',
      district: 'Subtanjalla',
      subchannel: 'AGROINDUSTRIA',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.DIAMANTE,
      bottlesHolding: 25,
      creditLimit: 3000.00,
      currentDebt: 450.00,
    },
    {
      documentType: DocumentType.DNI,
      documentNumber: '45678912',
      name: 'Dra. María Elena Fernández',
      email: 'maria.fernandez@clinica.demo',
      phone: '+51 956 112 334',
      address: 'Av. San Martín 450, Urb. Luren',
      zone: 'Centro',
      district: 'Ica',
      subchannel: 'SALUD',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.PLATA,
      bottlesHolding: 3,
      creditLimit: 200.00,
      currentDebt: 30.00,
    },
    {
      documentType: DocumentType.DNI,
      documentNumber: '71234567',
      name: 'Ing. Roberto Benavides Rojas',
      email: 'rbenavides@constructora.demo',
      phone: '+51 956 554 667',
      address: 'Calle Bolívar 312, Urb. San Isidro',
      zone: 'San Isidro',
      district: 'Ica',
      subchannel: 'HOGARES',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.BRONCE,
      bottlesHolding: 2,
      creditLimit: 100.00,
      currentDebt: 0.00,
    },
    {
      documentType: DocumentType.RUC,
      documentNumber: '20501122334',
      name: 'Gimnasio & Fitness Center Olimpo',
      businessName: 'Gym Olimpo Ica',
      email: 'contacto@gymolimpo.demo',
      phone: '+51 956 443 221',
      address: 'Av. Cutervo 890',
      zone: 'Cutervo',
      district: 'Ica',
      subchannel: 'GIMNASIOS',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.PLATA,
      bottlesHolding: 8,
      creditLimit: 800.00,
      currentDebt: 120.00,
    },
    {
      documentType: DocumentType.DNI,
      documentNumber: '00000000',
      name: 'Clientes Varios / Venta de Mostrador',
      email: 'mostrador@vivelite.pe',
      phone: '000000000',
      address: 'Local Principal Guadalupe',
      zone: 'Guadalupe',
      district: 'Ica',
      subchannel: 'MOSTRADOR',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.BRONCE,
      bottlesHolding: 0,
      creditLimit: 0.00,
      currentDebt: 0.00,
    },
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const cust = await prisma.customer.upsert({
      where: { documentNumber: c.documentNumber },
      update: {
        bottlesHolding: c.bottlesHolding,
        currentDebt: c.currentDebt,
        creditLimit: c.creditLimit,
      },
      create: {
        documentType: c.documentType,
        documentNumber: c.documentNumber,
        name: c.name,
        businessName: c.businessName,
        email: c.email,
        phone: c.phone,
        address: c.address,
        zone: c.zone,
        district: c.district,
        subchannel: c.subchannel,
        customerType: c.customerType,
        loyaltyTier: c.loyaltyTier,
        bottlesHolding: c.bottlesHolding,
        creditLimit: c.creditLimit,
        currentDebt: c.currentDebt,
        status: EntityStatus.ACTIVE,
      },
    });
    createdCustomers.push(cust);
  }
  console.log(`   ✓ ${createdCustomers.length} clientes creados y actualizados.`);

  // 6. STOCK DE BIDONES EN PLANTA
  console.log('6. Inicializando balance de bidones en planta...');
  const existingStock = await prisma.bottleStock.findFirst();
  if (existingStock) {
    await prisma.bottleStock.update({
      where: { id: existingStock.id },
      data: {
        totalFull: 150,
        totalEmpty: 85,
        threshold: 30,
      },
    });
  } else {
    await prisma.bottleStock.create({
      data: {
        productId: 1,
        totalFull: 150,
        totalEmpty: 85,
        threshold: 30,
      },
    });
  }

  // 7. PEDIDOS DE PRUEBA EN DIVERSOS ESTADOS
  console.log('7. Creando pedidos de reparto...');
  const sampleOrders = [
    {
      orderNumber: 'PED-2026-00101',
      customerId: createdCustomers[0].id,
      driverId: driverUser.id,
      status: OrderStatus.ENTREGADO,
      subtotal: 90.00,
      total: 90.00,
      deliveryAddress: createdCustomers[0].address,
      notes: 'Entregar en cocina principal del restaurante',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      orderNumber: 'PED-2026-00102',
      customerId: createdCustomers[1].id,
      driverId: driverUser.id,
      status: OrderStatus.EN_RUTA,
      subtotal: 150.00,
      total: 150.00,
      deliveryAddress: createdCustomers[1].address,
      notes: 'Solicitar pase de ingreso en garita 2',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      orderNumber: 'PED-2026-00103',
      customerId: createdCustomers[2].id,
      driverId: null,
      status: OrderStatus.CONFIRMADO,
      subtotal: 30.00,
      total: 30.00,
      deliveryAddress: createdCustomers[2].address,
      notes: 'Timbre segundo piso',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      orderNumber: 'PED-2026-00104',
      customerId: createdCustomers[4].id,
      driverId: null,
      status: OrderStatus.PENDIENTE,
      subtotal: 60.00,
      total: 60.00,
      deliveryAddress: createdCustomers[4].address,
      notes: 'Recepción del gimnasio',
      createdAt: new Date(),
    },
  ];

  for (const ord of sampleOrders) {
    const existing = await prisma.order.findUnique({ where: { orderNumber: ord.orderNumber } });
    if (!existing) {
      await prisma.order.create({
        data: {
          orderNumber: ord.orderNumber,
          customerId: ord.customerId,
          driverId: ord.driverId,
          status: ord.status,
          subtotal: ord.subtotal,
          tax: 0.00,
          total: ord.total,
          deliveryAddress: ord.deliveryAddress,
          notes: ord.notes,
          createdAt: ord.createdAt,
          items: {
            create: [
              {
                productId: prodRecarga20L.id,
                quantity: Math.floor(ord.total / 15),
                unitPrice: 15.00,
                totalPrice: ord.total,
              },
            ],
          },
        },
      });
    }
  }

  // 8. HISTORIAL DE VENTAS Y COMPROBANTES DE PRUEBA (ÚLTIMOS 7 DÍAS)
  console.log('8. Generando ventas históricas para gráficos del Dashboard...');
  const salesCount = await prisma.sale.count();
  if (salesCount < 5) {
    const sampleSales = [
      {
        saleNumber: 'V-2026-0001',
        customerId: createdCustomers[0].id,
        userId: sellerUser.id,
        subtotal: 76.27,
        tax: 13.73,
        total: 90.00,
        paidAmount: 90.00,
        balanceDue: 0.00,
        saleType: SaleType.CONTADO,
        paymentStatus: PaymentStatus.PAGADO,
        daysAgo: 5,
        items: [{ prod: prodRecarga20L, qty: 6, price: 15.00 }],
      },
      {
        saleNumber: 'V-2026-0002',
        customerId: createdCustomers[1].id,
        userId: sellerUser.id,
        subtotal: 127.12,
        tax: 22.88,
        total: 150.00,
        paidAmount: 0.00,
        balanceDue: 150.00,
        saleType: SaleType.CREDITO,
        paymentStatus: PaymentStatus.PENDIENTE,
        daysAgo: 3,
        items: [{ prod: prodRecarga20L, qty: 10, price: 15.00 }],
      },
      {
        saleNumber: 'V-2026-0003',
        customerId: createdCustomers[2].id,
        userId: sellerUser.id,
        subtotal: 35.00,
        tax: 0.00,
        total: 35.00,
        paidAmount: 35.00,
        balanceDue: 0.00,
        saleType: SaleType.CONTADO,
        paymentStatus: PaymentStatus.PAGADO,
        daysAgo: 2,
        items: [{ prod: prodBombaUSB, qty: 1, price: 35.00 }],
      },
      {
        saleNumber: 'V-2026-0004',
        customerId: createdCustomers[3].id,
        userId: sellerUser.id,
        subtotal: 25.42,
        tax: 4.58,
        total: 30.00,
        paidAmount: 30.00,
        balanceDue: 0.00,
        saleType: SaleType.CONTADO,
        paymentStatus: PaymentStatus.PAGADO,
        daysAgo: 1,
        items: [{ prod: prodRecarga20L, qty: 2, price: 15.00 }],
      },
      {
        saleNumber: 'V-2026-0005',
        customerId: createdCustomers[4].id,
        userId: sellerUser.id,
        subtotal: 50.85,
        tax: 9.15,
        total: 60.00,
        paidAmount: 60.00,
        balanceDue: 0.00,
        saleType: SaleType.CONTADO,
        paymentStatus: PaymentStatus.PAGADO,
        daysAgo: 0,
        items: [{ prod: prodRecarga20L, qty: 4, price: 15.00 }],
      },
    ];

    for (const s of sampleSales) {
      const saleDate = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);
      await prisma.sale.create({
        data: {
          saleNumber: s.saleNumber,
          customerId: s.customerId,
          userId: s.userId,
          subtotal: s.subtotal,
          tax: s.tax,
          discount: 0.00,
          total: s.total,
          paidAmount: s.paidAmount,
          balanceDue: s.balanceDue,
          saleType: s.saleType,
          paymentStatus: s.paymentStatus,
          createdAt: saleDate,
          items: {
            create: s.items.map((it) => ({
              productId: it.prod.id,
              quantity: it.qty,
              unitPrice: it.price,
              totalPrice: it.qty * it.price,
            })),
          },
        },
      });
    }
  }

  console.log('====================================================');
  console.log('✅ SEED DEMO COMPLETADO CON ÉXITO');
  console.log('   Credenciales de Acceso para Portafolio:');
  console.log('   - Administrador: admin@demo.local    | Demo123!');
  console.log('   - Vendedor:      vendedor@demo.local | Demo123!');
  console.log('   - Cajero:        cajero@demo.local   | Demo123!');
  console.log('   - Repartidor:    repartidor@demo.local | Demo123!');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar seed de demostración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
