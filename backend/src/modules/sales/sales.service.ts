import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { FilterSaleDto } from './dto/filter-sale.dto';
import {
  CashShiftStatus,
  InventoryMovementType,
  PaymentStatus,
  SaleType,
  BottleTransactionType,
  Prisma,
} from '@prisma/client';
import * as ExcelJS from 'exceljs';


@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSaleDto, userId?: string) {
    if (!createDto.items || createDto.items.length === 0) {
      throw new BadRequestException('La venta debe incluir al menos un producto');
    }

    return this.prisma.$transaction(async (tx) => {
      // Bloqueo a nivel de transacción PostgreSQL para serializar correlativos y evitar colisiones concurrentes
      try {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(424242)`;
      } catch (err) {
        // Ignorar si el motor es mock en pruebas unitarias
      }

      let customerId = createDto.customerId;
      let customer: any;

      if (!customerId) {
        // Asignar o crear cliente genérico de mostrador
        customer = await tx.customer.upsert({
          where: { documentNumber: '00000000' },
          update: {},
          create: {
            documentType: 'DNI',
            documentNumber: '00000000',
            name: 'Público General / Mostrador',
            phone: '999999999',
            address: 'Venta Directa en Almacén',
          },
        });
        customerId = customer.id;
      } else {
        customer = await tx.customer.findFirst({
          where: { id: customerId, deletedAt: null },
        });
        if (!customer) {
          throw new NotFoundException(`Cliente con ID ${customerId} no encontrado`);
        }
      }

      let activeShift: any = null;
      if (createDto.payment && createDto.payment.amount > 0) {
        activeShift = await tx.cashShift.findFirst({
          where: { status: CashShiftStatus.ABIERTA },
          orderBy: { openedAt: 'desc' },
        });
      }

      // 3. Generar número de comprobante interno de venta correlativo (concurrencia segura)
      const currentYear = new Date().getFullYear();
      const lastSale = await tx.sale.findFirst({
        where: {
          saleNumber: { startsWith: `VTA-${currentYear}-` },
        },
        orderBy: { createdAt: 'desc' },
        select: { saleNumber: true },
      });

      let nextNum = 1;
      if (lastSale?.saleNumber) {
        const parts = lastSale.saleNumber.split('-');
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) nextNum = lastSeq + 1;
      }

      const countThisYear = await tx.sale.count({
        where: {
          createdAt: {
            gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          },
        },
      });

      const nextCorrelative = Math.max(nextNum, countThisYear + 1);
      const saleNumber = `VTA-${currentYear}-${String(nextCorrelative).padStart(5, '0')}`;

      let subtotal = 0;
      let totalDiscount = 0;
      let returnableProductsSold = 0;

      const preparedItems: any[] = [];

      for (const itemDto of createDto.items) {
        const product = await tx.product.findFirst({
          where: { id: itemDto.productId, deletedAt: null },
        });

        if (!product) {
          throw new NotFoundException(`Producto con ID ${itemDto.productId} no encontrado`);
        }

        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para el producto "${product.name}". Disponible: ${product.stock}, Solicitado: ${itemDto.quantity}`,
          );
        }

        const unitPrice = itemDto.unitPrice !== undefined ? itemDto.unitPrice : Number(product.price);
        const itemDiscount = itemDto.discount || 0;
        const totalPrice = unitPrice * itemDto.quantity - itemDiscount;

        subtotal += unitPrice * itemDto.quantity;
        totalDiscount += itemDiscount;

        if (product.isReturnable) {
          returnableProductsSold += itemDto.quantity;
        }

        preparedItems.push({
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice,
          discount: itemDiscount,
          totalPrice,
          product,
        });
      }

      const total = Math.max(0, subtotal - totalDiscount);
      // En Perú el IGV 18% ya está incluido en los precios finales de venta
      const tax = Math.round((total - total / 1.18) * 100) / 100;
      const netSubtotal = total - tax;

      const paidAmount = createDto.payment ? Number(createDto.payment.amount) : 0;
      const balanceDue = Math.max(0, total - paidAmount);

      let paymentStatus: PaymentStatus = PaymentStatus.PAGADO;
      if (createDto.saleType === SaleType.CREDITO) {
        if (paidAmount === 0) paymentStatus = PaymentStatus.PENDIENTE;
        else if (balanceDue > 0) paymentStatus = PaymentStatus.PARCIAL;
        else paymentStatus = PaymentStatus.PAGADO;

        // Validar límite de crédito del cliente si es empresa/frecuente
        const newTotalDebt = Number(customer.currentDebt) + balanceDue;
        const creditLimit = Number(customer.creditLimit);
        if (creditLimit > 0 && newTotalDebt > creditLimit) {
          throw new BadRequestException(
            `Esta venta supera el límite de crédito del cliente. Deuda actual: S/ ${customer.currentDebt}, límite: S/ ${creditLimit}, requeriría: S/ ${newTotalDebt}`,
          );
        }
      } else {
        if (paidAmount < total) {
          throw new BadRequestException(
            `La venta al contado requiere el pago completo. Total: S/ ${total.toFixed(2)}, Monto recibido: S/ ${paidAmount.toFixed(2)}`,
          );
        }
      }

      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerId,
          userId,
          saleType: createDto.saleType || SaleType.CONTADO,
          paymentStatus,
          subtotal: netSubtotal,
          discount: totalDiscount,
          tax,
          total,
          paidAmount,
          balanceDue,
          dueDate: createDto.dueDate ? new Date(createDto.dueDate) : null,
          zone: createDto.zone?.trim() || customer.zone || 'Central',
          district: createDto.district?.trim() || customer.district || 'Lima',
          subchannel:
            createDto.subchannel?.trim() ||
            customer.subchannel ||
            (createDto.customerId ? 'DELIVERY' : 'MOSTRADOR'),
          bottleCondition20L:
            createDto.bottleCondition20L?.trim() ||
            (createDto.bottlesReturned && createDto.bottlesReturned > 0
              ? 'RECARGA'
              : 'NUEVO_CON_ENVASE'),
          notes: createDto.notes?.trim(),
          items: {

            create: preparedItems.map((p) => ({
              productId: p.productId,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              discount: p.discount,
              totalPrice: p.totalPrice,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      let paymentRecord: any = null;
      if (paidAmount > 0 && createDto.payment) {
        paymentRecord = await tx.payment.create({
          data: {
            saleId: sale.id,
            shiftId: activeShift ? activeShift.id : null,
            receivedById: userId,
            amount: paidAmount,
            paymentMethod: createDto.payment.paymentMethod,
            operationCode: createDto.payment.operationCode?.trim(),
          },
        });
      }

      // 8. Efectos en Inventario (Descontar stock y registrar en Kardex)
      for (const item of preparedItems) {
        const prevStock = item.product.stock;
        const nextStock = prevStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: nextStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            movementType: InventoryMovementType.VENTA,
            quantity: -item.quantity,
            previousStock: prevStock,
            newStock: nextStock,
            unitCost: Number(item.product.cost),
            reason: `Venta ${sale.saleNumber} a cliente ${customer.name}`,
            referenceType: 'SALE',
            referenceId: sale.id,
            userId,
          },
        });
      }

      const bottlesReturned = createDto.bottlesReturned || 0;
      const netBottleChange = returnableProductsSold - bottlesReturned;

      if (netBottleChange !== 0 || bottlesReturned > 0) {
        let newHolding = customer.bottlesHolding + netBottleChange;
        if (newHolding < 0) newHolding = 0;

        await tx.customer.update({
          where: { id: customerId },
          data: { bottlesHolding: newHolding },
        });

        // Registrar en Kardex de bidones del cliente
        await tx.bottleTransaction.create({
          data: {
            customerId,
            saleId: sale.id,
            type:
              netBottleChange > 0
                ? BottleTransactionType.ENTREGA
                : BottleTransactionType.DEVOLUCION,
            quantity: Math.abs(netBottleChange),
            balanceAfter: newHolding,
            notes: `Venta ${sale.saleNumber}: llevó ${returnableProductsSold} bidón(es), devolvió ${bottlesReturned} vacío(s)`,
            recordedById: userId,
          },
        });
      }

      if (balanceDue > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            currentDebt: { increment: balanceDue },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_SALE',
          entity: 'Sale',
          entityId: sale.id,
          newValues: {
            saleNumber: sale.saleNumber,
            total,
            paidAmount,
            balanceDue,
            customerId,
          },
        },
      });

      return {
        sale,
        payment: paymentRecord,
        bottlesSummary: {
          sold: returnableProductsSold,
          returned: bottlesReturned,
          newHolding: customer.bottlesHolding + netBottleChange,
        },
        message: `Venta ${sale.saleNumber} registrada exitosamente por S/ ${total.toFixed(2)}.`,
      };
    });
  }

  async findAll(filterDto: FilterSaleDto) {
    const {
      page = 1,
      limit = 20,
      search,
      customerId,
      saleType,
      paymentStatus,
      startDate,
      endDate,
    } = filterDto;

    const skip = (page - 1) * limit;
    const where: Prisma.SaleWhereInput = {};

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { saleNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { documentNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (customerId) where.customerId = customerId;
    if (saleType) where.saleType = saleType;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, documentNumber: true, phone: true } },
          user: { select: { firstName: true, lastName: true } },
          payments: { select: { id: true, amount: true, paymentMethod: true, operationCode: true } },
          items: { include: { product: { select: { name: true, unit: true } } } },
        },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { firstName: true, lastName: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, code: true, name: true, unit: true, isReturnable: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            receivedBy: { select: { firstName: true, lastName: true } },
          },
        },
        electronicDocument: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return sale;
  }

  async exportSalesExcel(filterDto: FilterSaleDto): Promise<Buffer> {
    const where: Prisma.SaleWhereInput = {};
    if (filterDto.search && filterDto.search.trim() !== '') {
      const q = filterDto.search.trim();
      where.OR = [
        { saleNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { documentNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (filterDto.customerId) where.customerId = filterDto.customerId;
    if (filterDto.saleType) where.saleType = filterDto.saleType;
    if (filterDto.paymentStatus) where.paymentStatus = filterDto.paymentStatus;
    if (filterDto.startDate || filterDto.endDate) {
      where.createdAt = {};
      if (filterDto.startDate) where.createdAt.gte = new Date(filterDto.startDate);
      if (filterDto.endDate) where.createdAt.lte = new Date(filterDto.endDate);
    }

    const sales = await this.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vivelite Engineering';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Registro de Ventas', {
      views: [{ showGridLines: true }],
    });

    worksheet.mergeCells('A1:Q1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'VIVELITE - DISTRIBUIDORA DE AGUA PURIFICADA';
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:Q2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'REGISTRO OFICIAL DE VENTAS Y CONTROL DE ENVASES (REGIÓN ICA)';
    subtitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF38BDF8' } }; // Sky 400
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 22;

    worksheet.mergeCells('A3:Q3');
    const metaCell = worksheet.getCell('A3');
    const nowStr = new Date().toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'short' });
    metaCell.value = `Fecha de Emisión: ${nowStr}   |   RUC: 20608945612   |   Planta: Salas - Guadalupe, Ica   |   Registros: ${sales.length}`;
    metaCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF475569' } };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(3).height = 18;

    worksheet.getRow(4).height = 8; // Espacio

    const headers = [
      'N° VENTA',
      'CLIENTE / RAZÓN SOCIAL',
      'DIRECCIÓN DE ENTREGA',
      'ZONA DE REPARTO',
      'DISTRITO',
      'DNI / RUC',
      'TELÉFONO',
      'SUB CANAL',
      'CANTIDAD 20L',
      'PRECIO 20L',
      'CONDICIÓN 20L',
      'MONTO 20L',
      'CANTIDAD 7L',
      'PRECIO 7L',
      'MONTO 7L',
      'TOTAL (S/)',
      'FECHA COMPRA',
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Brand Blue
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0369A1' } },
        left: { style: 'thin', color: { argb: 'FFBAE6FD' } },
        bottom: { style: 'medium', color: { argb: 'FF0369A1' } },
        right: { style: 'thin', color: { argb: 'FFBAE6FD' } },
      };
    });

    let startRowNumber = 6;
    let totalQty20L = 0;
    let totalAmount20L = 0;
    let totalQty7L = 0;
    let totalAmount7L = 0;
    let grandTotal = 0;

    sales.forEach((sale, index) => {
      const item20L = sale.items.find(
        (it) =>
          it.product.code.includes('20L') ||
          it.product.name.includes('20L') ||
          it.product.unit === 'BIDON_20L',
      );
      const item7L = sale.items.find(
        (it) =>
          it.product.code.includes('7L') ||
          it.product.name.includes('7L') ||
          it.product.name.includes('7 Litros'),
      );

      const qty20L = item20L ? item20L.quantity : 0;
      const price20L = item20L ? Number(item20L.unitPrice) : 0;
      const amount20L = item20L ? Number(item20L.totalPrice) : 0;
      const cond20L = sale.bottleCondition20L || (qty20L > 0 ? 'RECARGA' : '-');

      const qty7L = item7L ? item7L.quantity : 0;
      const price7L = item7L ? Number(item7L.unitPrice) : 0;
      const amount7L = item7L ? Number(item7L.totalPrice) : 0;
      const saleTotal = Number(sale.total);

      totalQty20L += qty20L;
      totalAmount20L += amount20L;
      totalQty7L += qty7L;
      totalAmount7L += amount7L;
      grandTotal += saleTotal;

      const dateFormatted = new Date(sale.createdAt).toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
      });

      const row = worksheet.addRow([
        sale.saleNumber,
        sale.customer.name,
        sale.customer.address || '-',
        sale.zone || sale.customer.zone || 'Zona Central',
        sale.district || sale.customer.district || 'Salas Guadalupe',
        sale.customer.documentNumber || '-',
        sale.customer.phone || '-',
        sale.subchannel || sale.customer.subchannel || (sale.orderId ? 'DELIVERY' : 'MOSTRADOR'),
        qty20L,
        price20L,
        cond20L,
        amount20L,
        qty7L,
        price7L,
        amount7L,
        saleTotal,
        dateFormatted,
      ]);

      row.height = 20;

      // Color alternado zebra
      const isEven = index % 2 === 0;
      const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Formatos específicos
        if (colNumber === 1 || colNumber === 6 || colNumber === 7 || colNumber === 11 || colNumber === 17) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 9 || colNumber === 13) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (colNumber === 10 || colNumber === 12 || colNumber === 14 || colNumber === 15) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"S/" #,##0.00';
        } else if (colNumber === 16) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"S/" #,##0.00';
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0369A1' } };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    const totalRowIndex = startRowNumber + sales.length;
    const totalRow = worksheet.addRow([
      'TOTALES GENERALES CONSOLIDADOS',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalQty20L,
      '',
      '',
      totalAmount20L,
      totalQty7L,
      '',
      totalAmount7L,
      grandTotal,
      '',
    ]);

    totalRow.height = 26;
    worksheet.mergeCells(`A${totalRowIndex}:H${totalRowIndex}`);

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF166534' } }; // Green 800
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Green 100
      cell.border = {
        top: { style: 'double', color: { argb: 'FF16A34A' } },
        bottom: { style: 'double', color: { argb: 'FF16A34A' } },
        left: { style: 'thin', color: { argb: 'FF86EFAC' } },
        right: { style: 'thin', color: { argb: 'FF86EFAC' } },
      };

      if (colNumber === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 9 || colNumber === 13) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '#,##0';
      } else if (colNumber === 12 || colNumber === 15 || colNumber === 16) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '"S/" #,##0.00';
      }
    });

    worksheet.columns = [
      { width: 16 }, // N° Venta
      { width: 36 }, // Cliente
      { width: 40 }, // Dirección
      { width: 34 }, // Zona
      { width: 30 }, // Distrito
      { width: 16 }, // DNI / RUC
      { width: 16 }, // Teléfono
      { width: 28 }, // Subcanal
      { width: 15 }, // Cant 20L
      { width: 14 }, // Precio 20L
      { width: 18 }, // Condición 20L
      { width: 16 }, // Monto 20L
      { width: 14 }, // Cant 7L
      { width: 14 }, // Precio 7L
      { width: 16 }, // Monto 7L
      { width: 18 }, // Total
      { width: 22 }, // Fecha
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

