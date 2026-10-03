import {
  PrismaClient,
  Role,
  EntityStatus,
  UnitOfMeasure,
  CustomerType,
  LoyaltyTier,
  SaleType,
  PaymentStatus,
  PaymentMethod,
  OrderStatus,
  DeliveryStatus,
  InvoiceType,
  SunatStatus,
  BottleTransactionType,
  CashShiftStatus,
  CashMovementType,
  InventoryMovementType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required to run database seeds.');
}

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const pool = new Pool({
  connectionString,
  ...(isLocalhost ? {} : { ssl: { rejectUnauthorized: false } }),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando carga de datos de prueba para la Region Ica (Vivelite)...');

  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const vendedorHash = await bcrypt.hash('Vendedor123!', 10);
  const repartidorHash = await bcrypt.hash('Repartidor123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vivelite.pe' },
    update: {},
    create: {
      email: 'admin@vivelite.pe',
      password: passwordHash,
      firstName: 'Administrador',
      lastName: 'Principal',
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
      password: vendedorHash,
      firstName: 'Carlos',
      lastName: 'Guadalupe',
      phone: '+51 956 789 012',
      role: Role.VENDEDOR,
      status: EntityStatus.ACTIVE,
    },
  });

  const choferGuadalupe = await prisma.user.upsert({
    where: { email: 'repartidor@vivelite.pe' },
    update: {},
    create: {
      email: 'repartidor@vivelite.pe',
      password: repartidorHash,
      firstName: 'Jorge',
      lastName: 'Ruta Guadalupe / Villacurí',
      phone: '+51 956 345 678',
      role: Role.REPARTIDOR,
      status: EntityStatus.ACTIVE,
    },
  });

  const choferIcaCentro = await prisma.user.upsert({
    where: { email: 'repartidor2@vivelite.pe' },
    update: {},
    create: {
      email: 'repartidor2@vivelite.pe',
      password: repartidorHash,
      firstName: 'Manuel',
      lastName: 'Ruta Ica Centro / Sur',
      phone: '+51 956 888 999',
      role: Role.REPARTIDOR,
      status: EntityStatus.ACTIVE,
    },
  });

  console.log('Usuarios del sistema configurados.');

  const catAgua = await prisma.category.upsert({
    where: { name: 'Agua Purificada' },
    update: {},
    create: { name: 'Agua Purificada', description: 'Línea de agua de mesa purificada y ozonizada' },
  });

  const catAccesorios = await prisma.category.upsert({
    where: { name: 'Accesorios y Dispensadores' },
    update: {},
    create: { name: 'Accesorios y Dispensadores', description: 'Dispensadores, bombas y caños' },
  });

  const prodRecarga20L = await prisma.product.upsert({
    where: { code: 'AGUA-REC-20L' },
    update: { stock: 450 },
    create: {
      code: 'AGUA-REC-20L',
      name: 'Recarga Bidón 20 Litros',
      description: 'Recarga de agua purificada dejando bidón vacío a cambio',
      categoryId: catAgua.id,
      price: 15.00,
      cost: 4.50,
      unit: UnitOfMeasure.BIDON_20L,
      stock: 450,
      minStock: 50,
      isReturnable: true,
    },
  });

  const prodNuevo20L = await prisma.product.upsert({
    where: { code: 'AGUA-NUEVO-20L' },
    update: { stock: 120 },
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

  const prodCaja20L = await prisma.product.upsert({
    where: { code: 'AGUA-CAJA-20L' },
    update: { stock: 95 },
    create: {
      code: 'AGUA-CAJA-20L',
      name: 'Caja de Agua 20 Litros Descartable',
      description: 'Caja con bolsa y caño vertedor desechable, no requiere envase',
      categoryId: catAgua.id,
      price: 25.00,
      cost: 11.00,
      unit: UnitOfMeasure.CAJA,
      stock: 95,
      minStock: 15,
      isReturnable: false,
    },
  });

  const prodBidon7L = await prisma.product.upsert({
    where: { code: 'AGUA-REC-7L' },
    update: { stock: 80 },
    create: {
      code: 'AGUA-REC-7L',
      name: 'Bidón 7 Litros Retornable con Caño',
      description: 'Bidón mediano de 7 litros fácil de transportar',
      categoryId: catAgua.id,
      price: 10.00,
      cost: 3.20,
      unit: UnitOfMeasure.BIDON_10L,
      stock: 80,
      minStock: 10,
      isReturnable: true,
    },
  });

  const prodPackBotellas = await prisma.product.upsert({
    where: { code: 'PACK-BOT-625ML' },
    update: { stock: 150 },
    create: {
      code: 'PACK-BOT-625ML',
      name: 'Paquete de Botellas 625ml x 15 Unidades',
      description: 'Pack de agua personal sin gas para eventos y empresas',
      categoryId: catAgua.id,
      price: 18.00,
      cost: 8.50,
      unit: UnitOfMeasure.PAQUETE,
      stock: 150,
      minStock: 20,
      isReturnable: false,
    },
  });

  const prodBombaElectrica = await prisma.product.upsert({
    where: { code: 'DISP-BOMBA-ELEC' },
    update: { stock: 40 },
    create: {
      code: 'DISP-BOMBA-ELEC',
      name: 'Bomba Eléctrica USB para Bidón 20L',
      description: 'Dispensador automático con batería recargable vía USB',
      categoryId: catAccesorios.id,
      price: 35.00,
      cost: 16.00,
      unit: UnitOfMeasure.UNIDAD,
      stock: 40,
      minStock: 8,
      isReturnable: false,
    },
  });

  console.log('Catalogo de productos creado.');

  const supplier1 = await prisma.supplier.upsert({
    where: { ruc: '20501234568' },
    update: {},
    create: {
      ruc: '20501234568',
      name: 'Plásticos Industriales del Sur S.A.C.',
      contactName: 'Ing. Roberto Mendoza',
      phone: '056-224488',
      email: 'ventas@plasticosdelsur.pe',
      address: 'Zona Industrial Paracas, Pisco',
    },
  });

  const purchase1 = await prisma.purchase.upsert({
    where: { purchaseNumber: 'COM-2026-0001' },
    update: {},
    create: {
      purchaseNumber: 'COM-2026-0001',
      supplierId: supplier1.id,
      invoiceNumber: 'F001-0004521',
      total: 3500.00,
      notes: 'Lote de 200 bidones nuevos de policarbonato 20L para stock inicial',
      createdById: admin.id,
      items: {
        create: [
          {
            productId: prodNuevo20L.id,
            quantity: 100,
            unitCost: 22.00,
            totalCost: 2200.00,
          },
          {
            productId: prodBombaElectrica.id,
            quantity: 50,
            unitCost: 16.00,
            totalCost: 800.00,
          },
        ],
      },
    },
  });

  const mockCustomers = [
    {
      documentType: 'RUC' as const,
      documentNumber: '20608945001',
      name: 'Agrícola Don Ricardo S.A.C.',
      businessName: 'Agrícola Don Ricardo S.A.C.',
      phone: '956998811',
      whatsapp: '956998811',
      email: 'compras@donricardo.com.pe',
      address: 'Carretera Panamericana Sur Km 295, Villacurí',
      reference: 'Entrada Fundo Villacurí, Salas Guadalupe',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Villacurí (Salas)',
      subchannel: 'EMPRESA / AGROEXPORTADORA',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.DIAMANTE,
      bottlesHolding: 45,
      creditLimit: 5000.00,
      currentDebt: 675.00,
    },
    {
      documentType: 'RUC' as const,
      documentNumber: '20608945002',
      name: 'Fundo Santa Lucía de Guadalupe S.A.',
      businessName: 'Fundo Santa Lucía de Guadalupe S.A.',
      phone: '956998822',
      whatsapp: '956998822',
      email: 'logistica@fundo-santalucia.pe',
      address: 'Av. Las Palmas s/n, Expansión Urbana',
      reference: 'Frente al reservorio de agua, Salas Guadalupe',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Expansión Urbana (Guadalupe)',
      subchannel: 'EMPRESA / AGROEXPORTADORA',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.ORO,
      bottlesHolding: 28,
      creditLimit: 3000.00,
      currentDebt: 420.00,
    },
    {
      documentType: 'RUC' as const,
      documentNumber: '20608945003',
      name: 'Hotel & Resort Las Dunas de Ica S.A.',
      businessName: 'Hotel & Resort Las Dunas de Ica S.A.',
      phone: '956998833',
      whatsapp: '956998833',
      email: 'recepcion@lasdunasica.pe',
      address: 'Av. La Angostura 400, Ica',
      reference: 'Zona Residencial La Angostura',
      zone: 'Zona 1 - Ica Centro & Metropolitana',
      district: 'Ica Cercado',
      subchannel: 'HOTEL / RESTAURANTE / TURISMO',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.DIAMANTE,
      bottlesHolding: 50,
      creditLimit: 4000.00,
      currentDebt: 0.00,
    },
    {
      documentType: 'RUC' as const,
      documentNumber: '20608945004',
      name: 'Huacachina Oasis Lodge E.I.R.L.',
      businessName: 'Huacachina Oasis Lodge E.I.R.L.',
      phone: '956998844',
      whatsapp: '956998844',
      email: 'contacto@huacachinaoasis.com',
      address: 'Balneario de Huacachina Mz. C Lt. 4',
      reference: 'Frente a la Laguna de Huacachina',
      zone: 'Zona 1 - Ica Centro & Metropolitana',
      district: 'Comatrana / Huacachina',
      subchannel: 'HOTEL / RESTAURANTE / TURISMO',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.PLATA,
      bottlesHolding: 16,
      creditLimit: 1200.00,
      currentDebt: 180.00,
    },
    {
      documentType: 'DNI' as const,
      documentNumber: '45892101',
      name: 'Lucía Mendoza Paredes',
      phone: '956111222',
      whatsapp: '956111222',
      address: 'Calle Real 234, Plaza de Armas',
      reference: 'A espaldas de la Iglesia de Salas Guadalupe',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Salas - Guadalupe (Centro / Plaza)',
      subchannel: 'HOGAR',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.PLATA,
      bottlesHolding: 3,
      creditLimit: 150.00,
      currentDebt: 0.00,
    },
    {
      documentType: 'DNI' as const,
      documentNumber: '45892102',
      name: 'Roberto Carlos Huamán Quispe',
      phone: '956222333',
      whatsapp: '956222333',
      address: 'Av. Principal 560, Macacona',
      reference: 'Cerca a la posta médica de Macacona',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Macacona',
      subchannel: 'HOGAR',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.BRONCE,
      bottlesHolding: 2,
      creditLimit: 100.00,
      currentDebt: 0.00,
    },
    {
      documentType: 'RUC' as const,
      documentNumber: '20608945005',
      name: 'Bodega & Minimarket Don Lucho',
      businessName: 'Bodega Don Lucho E.I.R.L.',
      phone: '956333444',
      whatsapp: '956333444',
      address: 'Av. Panamericana Norte 890, Subtanjalla',
      reference: 'Frente al grifo Primax de Subtanjalla',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Subtanjalla',
      subchannel: 'BODEGA / MINIMARKET',
      customerType: CustomerType.DISTRIBUIDOR,
      loyaltyTier: LoyaltyTier.ORO,
      bottlesHolding: 20,
      creditLimit: 2000.00,
      currentDebt: 300.00,
    },
    {
      documentType: 'DNI' as const,
      documentNumber: '45892103',
      name: 'María Elena Flores Ramos',
      phone: '956444555',
      whatsapp: '956444555',
      address: 'Calle Arequipa 320, La Tinguiña',
      reference: 'A 2 cuadras del mercado de La Tinguiña',
      zone: 'Zona 1 - Ica Centro & Metropolitana',
      district: 'La Tinguiña',
      subchannel: 'HOGAR',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.PLATA,
      bottlesHolding: 4,
      creditLimit: 120.00,
      currentDebt: 0.00,
    },
    {
      documentType: 'DNI' as const,
      documentNumber: '45892104',
      name: 'Víctor Raúl Espinoza Soto',
      phone: '956555666',
      whatsapp: '956555666',
      address: 'Av. Pachacútec 145, Parcona',
      reference: 'Frente al colegio de Parcona',
      zone: 'Zona 1 - Ica Centro & Metropolitana',
      district: 'Parcona',
      subchannel: 'HOGAR',
      customerType: CustomerType.HOGAR,
      loyaltyTier: LoyaltyTier.BRONCE,
      bottlesHolding: 2,
      creditLimit: 100.00,
      currentDebt: 0.00,
    },
    {
      documentType: 'RUC' as const,
      documentNumber: '20608945006',
      name: 'Restaurante Turístico El Catador',
      businessName: 'Inversiones Vitivinícolas El Catador S.A.C.',
      phone: '956666777',
      whatsapp: '956666777',
      email: 'administracion@elcatadorica.pe',
      address: 'Fundo Tres Esquinas 110, Subtanjalla',
      reference: 'Ruta del Pisco, Subtanjalla',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Subtanjalla',
      subchannel: 'HOTEL / RESTAURANTE / TURISMO',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.ORO,
      bottlesHolding: 18,
      creditLimit: 1800.00,
      currentDebt: 270.00,
    },
    {
      documentType: 'RUC' as const,
      documentNumber: '20608945007',
      name: 'Clínica Ica Salud S.A.C.',
      businessName: 'Servicios Médicos Ica Salud S.A.C.',
      phone: '956777888',
      whatsapp: '956777888',
      email: 'logistica@icasalud.pe',
      address: 'Av. Cutervo 450, Ica Cercado',
      reference: 'Frente al centro comercial El Quinde',
      zone: 'Zona 1 - Ica Centro & Metropolitana',
      district: 'Ica Cercado',
      subchannel: 'EMPRESA / AGROEXPORTADORA',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.DIAMANTE,
      bottlesHolding: 35,
      creditLimit: 3500.00,
      currentDebt: 0.00,
    },
    {
      documentType: 'RUC' as const,
      documentNumber: '20608945008',
      name: 'Constructora & Logística Paracas S.A.C.',
      businessName: 'Paracas Marine Logistics S.A.C.',
      phone: '956888111',
      whatsapp: '956888111',
      address: 'Av. Los Libertadores 780, Paracas',
      reference: 'Cerca al Muelle El Chaco, Paracas',
      zone: 'Zona 4 - Provincia de Pisco',
      district: 'Paracas',
      subchannel: 'EMPRESA / AGROEXPORTADORA',
      customerType: CustomerType.EMPRESA,
      loyaltyTier: LoyaltyTier.ORO,
      bottlesHolding: 30,
      creditLimit: 3000.00,
      currentDebt: 450.00,
    },
  ];

  const createdCustomers: any[] = [];
  for (const custData of mockCustomers) {
    const cust = await prisma.customer.upsert({
      where: { documentNumber: custData.documentNumber },
      update: custData,
      create: custData,
    });
    createdCustomers.push(cust);
  }

  console.log(`${createdCustomers.length} Clientes de Ica registrados.`);

  const cashRegister = await prisma.cashRegister.upsert({
    where: { name: 'Caja Principal Guadalupe' },
    update: {},
    create: { name: 'Caja Principal Guadalupe', status: EntityStatus.ACTIVE },
  });

  const todayShift = await prisma.cashShift.create({
    data: {
      cashRegisterId: cashRegister.id,
      openedById: vendedor.id,
      openedAt: new Date(),
      initialBalance: 200.00,
      status: CashShiftStatus.ABIERTA,
      notes: 'Turno matutino de ventas y cobranzas en planta Guadalupe',
    },
  });

  // Movimiento de egreso menor en caja (ej: compra de combustible para reparto)
  await prisma.cashMovement.create({
    data: {
      shiftId: todayShift.id,
      recordedById: vendedor.id,
      type: CashMovementType.EGRESO,
      amount: 50.00,
      paymentMethod: PaymentMethod.EFECTIVO,
      reason: 'Combustible inicial para Camión de Reparto Ruta Guadalupe - Villacurí',
      referenceType: 'EXPENSE',
    },
  });

  const salesToCreate = [
    {
      customer: createdCustomers[0], // Agrícola Don Ricardo
      saleType: SaleType.CREDITO,
      paymentStatus: PaymentStatus.PENDIENTE,
      bottleCondition: 'RECARGA',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Villacurí (Salas)',
      subchannel: 'EMPRESA / AGROEXPORTADORA',
      items: [
        { product: prodRecarga20L, quantity: 45, unitPrice: 15.00 },
        { product: prodPackBotellas, quantity: 5, unitPrice: 18.00 },
      ],
      paymentMethod: PaymentMethod.TRANSFERENCIA,
      docSeries: 'F001',
      docNum: 1001,
      invoiceType: InvoiceType.FACTURA,
    },
    {
      customer: createdCustomers[2], // Hotel Las Dunas
      saleType: SaleType.CONTADO,
      paymentStatus: PaymentStatus.PAGADO,
      bottleCondition: 'RECARGA',
      zone: 'Zona 1 - Ica Centro & Metropolitana',
      district: 'Ica Cercado',
      subchannel: 'HOTEL / RESTAURANTE / TURISMO',
      items: [
        { product: prodRecarga20L, quantity: 30, unitPrice: 15.00 },
        { product: prodCaja20L, quantity: 10, unitPrice: 25.00 },
      ],
      paymentMethod: PaymentMethod.TRANSFERENCIA,
      docSeries: 'F001',
      docNum: 1002,
      invoiceType: InvoiceType.FACTURA,
    },
    {
      customer: createdCustomers[4], // Lucía Mendoza (Hogar Guadalupe)
      saleType: SaleType.CONTADO,
      paymentStatus: PaymentStatus.PAGADO,
      bottleCondition: 'RECARGA',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Salas - Guadalupe (Centro / Plaza)',
      subchannel: 'HOGAR',
      items: [
        { product: prodRecarga20L, quantity: 2, unitPrice: 15.00 },
      ],
      paymentMethod: PaymentMethod.YAPE,
      docSeries: 'B001',
      docNum: 5001,
      invoiceType: InvoiceType.BOLETA,
    },
    {
      customer: createdCustomers[6], // Bodega Don Lucho
      saleType: SaleType.CONTADO,
      paymentStatus: PaymentStatus.PAGADO,
      bottleCondition: 'CON_ENVASE_NUEVO',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Subtanjalla',
      subchannel: 'BODEGA / MINIMARKET',
      items: [
        { product: prodNuevo20L, quantity: 6, unitPrice: 45.00 },
        { product: prodBombaElectrica, quantity: 2, unitPrice: 35.00 },
      ],
      paymentMethod: PaymentMethod.PLIN,
      docSeries: 'B001',
      docNum: 5002,
      invoiceType: InvoiceType.BOLETA,
    },
    {
      customer: createdCustomers[7], // María Elena Flores (La Tinguiña)
      saleType: SaleType.CONTADO,
      paymentStatus: PaymentStatus.PAGADO,
      bottleCondition: 'RECARGA',
      zone: 'Zona 1 - Ica Centro & Metropolitana',
      district: 'La Tinguiña',
      subchannel: 'HOGAR',
      items: [
        { product: prodRecarga20L, quantity: 2, unitPrice: 15.00 },
        { product: prodBidon7L, quantity: 1, unitPrice: 10.00 },
      ],
      paymentMethod: PaymentMethod.EFECTIVO,
      docSeries: 'B001',
      docNum: 5003,
      invoiceType: InvoiceType.BOLETA,
    },
    {
      customer: createdCustomers[9], // Restaurante El Catador
      saleType: SaleType.CREDITO,
      paymentStatus: PaymentStatus.PENDIENTE,
      bottleCondition: 'RECARGA',
      zone: 'Zona 2 - Ica Norte & Salas Guadalupe',
      district: 'Subtanjalla',
      subchannel: 'HOTEL / RESTAURANTE / TURISMO',
      items: [
        { product: prodRecarga20L, quantity: 18, unitPrice: 15.00 },
      ],
      paymentMethod: PaymentMethod.TRANSFERENCIA,
      docSeries: 'F001',
      docNum: 1003,
      invoiceType: InvoiceType.FACTURA,
    },
    {
      customer: createdCustomers[10], // Clínica Ica Salud
      saleType: SaleType.CONTADO,
      paymentStatus: PaymentStatus.PAGADO,
      bottleCondition: 'RECARGA',
      zone: 'Zona 1 - Ica Centro & Metropolitana',
      district: 'Ica Cercado',
      subchannel: 'EMPRESA / AGROEXPORTADORA',
      items: [
        { product: prodRecarga20L, quantity: 25, unitPrice: 15.00 },
        { product: prodBombaElectrica, quantity: 3, unitPrice: 35.00 },
      ],
      paymentMethod: PaymentMethod.TRANSFERENCIA,
      docSeries: 'F001',
      docNum: 1004,
      invoiceType: InvoiceType.FACTURA,
    },
  ];

  let saleCounter = 1;
  for (const s of salesToCreate) {
    const subtotal = s.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const tax = Number((subtotal * 0.18 / 1.18).toFixed(2));
    const total = subtotal;
    const paidAmount = s.paymentStatus === PaymentStatus.PAGADO ? total : 0;
    const balanceDue = total - paidAmount;
    const saleNumber = `VTA-2026-${String(saleCounter).padStart(5, '0')}`;
    saleCounter++;

    const createdSale = await prisma.sale.create({
      data: {
        saleNumber,
        customerId: s.customer.id,
        userId: vendedor.id,
        saleType: s.saleType,
        paymentStatus: s.paymentStatus,
        subtotal,
        discount: 0,
        tax,
        total,
        paidAmount,
        balanceDue,
        zone: s.zone,
        district: s.district,
        subchannel: s.subchannel,
        bottleCondition20L: s.bottleCondition,
        notes: `Despacho programado para ${s.customer.name}`,
        items: {
          create: s.items.map((it) => ({
            productId: it.product.id,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discount: 0,
            totalPrice: it.quantity * it.unitPrice,
          })),
        },
      },
    });

    // Registrar Pago si fue pagado
    if (s.paymentStatus === PaymentStatus.PAGADO) {
      await prisma.payment.create({
        data: {
          saleId: createdSale.id,
          shiftId: todayShift.id,
          receivedById: vendedor.id,
          amount: total,
          paymentMethod: s.paymentMethod,
          operationCode: s.paymentMethod === PaymentMethod.EFECTIVO ? undefined : `OPE-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });
    }

    // Comprobante SUNAT
    await prisma.electronicDocument.create({
      data: {
        saleId: createdSale.id,
        invoiceType: s.invoiceType,
        series: s.docSeries,
        correlative: s.docNum,
        sunatStatus: SunatStatus.ACEPTADO,
        sunatResponseCode: '0',
        sunatResponseMessage: 'La Factura/Boleta ha sido aceptada por SUNAT',
        xmlUrl: `https://vivelite.pe/invoices/xml/${s.docSeries}-${s.docNum}.xml`,
        pdfUrl: `https://vivelite.pe/invoices/pdf/${s.docSeries}-${s.docNum}.pdf`,
      },
    });

    // Transacción de Bidón (Kardex de Envases)
    await prisma.bottleTransaction.create({
      data: {
        customerId: s.customer.id,
        saleId: createdSale.id,
        type: BottleTransactionType.ENTREGA,
        quantity: s.items[0]?.quantity || 2,
        balanceAfter: s.customer.bottlesHolding,
        recordedById: vendedor.id,
        notes: `Entrega de agua en envase retornable según venta ${saleNumber}`,
      },
    });
  }

  console.log(`${salesToCreate.length} Ventas, Comprobantes SUNAT y Pagos generados.`);

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'PED-2026-0001',
      customerId: createdCustomers[0].id, // Agrícola Don Ricardo
      driverId: choferGuadalupe.id,
      status: OrderStatus.ENTREGADO,
      deliveryAddress: 'Carretera Panamericana Sur Km 295, Villacurí',
      deliveryReference: 'Entrada Fundo Villacurí',
      scheduledDate: new Date(),
      deliveredAt: new Date(),
      subtotal: 675.00,
      total: 675.00,
      notes: 'Entregar en portería del packing de uva',
      items: {
        create: [
          { productId: prodRecarga20L.id, quantity: 45, unitPrice: 15.00, totalPrice: 675.00 },
        ],
      },
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order1.id,
      driverId: choferGuadalupe.id,
      status: DeliveryStatus.ENTREGADO,
      bottlesDelivered: 45,
      bottlesReturned: 45,
      notes: 'Entrega conforme, 45 vacíos recogidos en buen estado',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'PED-2026-0002',
      customerId: createdCustomers[1].id, // Fundo Santa Lucía
      driverId: choferGuadalupe.id,
      status: OrderStatus.EN_RUTA,
      deliveryAddress: 'Av. Las Palmas s/n, Expansión Urbana',
      deliveryReference: 'Frente al reservorio',
      scheduledDate: new Date(),
      subtotal: 420.00,
      total: 420.00,
      notes: 'Chofer en camino por la Panamericana hacia Guadalupe',
      items: {
        create: [
          { productId: prodRecarga20L.id, quantity: 28, unitPrice: 15.00, totalPrice: 420.00 },
        ],
      },
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order2.id,
      driverId: choferGuadalupe.id,
      status: DeliveryStatus.EN_RUTA,
      bottlesDelivered: 28,
      bottlesReturned: 0,
      notes: 'En tránsito hacia Expansión Urbana Guadalupe',
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'PED-2026-0003',
      customerId: createdCustomers[3].id, // Huacachina Oasis Lodge
      driverId: choferIcaCentro.id,
      status: OrderStatus.PENDIENTE,
      deliveryAddress: 'Balneario de Huacachina Mz. C Lt. 4',
      deliveryReference: 'Frente a la Laguna',
      scheduledDate: new Date(),
      subtotal: 240.00,
      total: 240.00,
      notes: 'Reparto programado para la tarde',
      items: {
        create: [
          { productId: prodRecarga20L.id, quantity: 16, unitPrice: 15.00, totalPrice: 240.00 },
        ],
      },
    },
  });

  console.log('Pedidos de reparto y entregas logisticas generadas.');

  await prisma.inventoryMovement.createMany({
    data: [
      {
        productId: prodRecarga20L.id,
        movementType: InventoryMovementType.ENTRADA,
        quantity: 500,
        previousStock: 0,
        newStock: 500,
        unitCost: 4.50,
        reason: 'Lote de Producción y Envasado en Planta Guadalupe',
        referenceType: 'PRODUCTION',
        userId: admin.id,
      },
      {
        productId: prodNuevo20L.id,
        movementType: InventoryMovementType.COMPRA,
        quantity: 150,
        previousStock: 0,
        newStock: 150,
        unitCost: 22.00,
        reason: 'Ingreso por Compra de Bidones Nuevos Factura F001-0004521',
        referenceType: 'PURCHASE',
        userId: admin.id,
      },
      {
        productId: prodRecarga20L.id,
        movementType: InventoryMovementType.VENTA,
        quantity: -50,
        previousStock: 500,
        newStock: 450,
        unitCost: 4.50,
        reason: 'Despachos del día en rutas Ica y Guadalupe',
        referenceType: 'SALE',
        userId: vendedor.id,
      },
    ],
  });

  // Stock en planta de bidones
  await prisma.bottleStock.deleteMany();
  await prisma.bottleStock.create({
    data: {
      productId: 1,
      totalEmpty: 230,
      totalFull: 450,
      threshold: 60,
    },
  });

  console.log('Carga masiva de datos de prueba completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error durante la siembra de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
