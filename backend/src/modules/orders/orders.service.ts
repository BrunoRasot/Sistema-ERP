import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { DeliverOrderDto } from './dto/deliver-order.dto';
import {
  OrderStatus,
  DeliveryStatus,
  InventoryMovementType,
  PaymentStatus,
  SaleType,
  BottleTransactionType,
  CashShiftStatus,
  CashMovementType,
  PaymentMethod,
  Role,
  Prisma,
} from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateOrderDto, userId?: string) {
    if (!createDto.items || createDto.items.length === 0) {
      throw new BadRequestException('El pedido debe incluir al menos un producto');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: createDto.customerId, deletedAt: null },
      });
      if (!customer) {
        throw new NotFoundException(`Cliente con ID ${createDto.customerId} no encontrado`);
      }

      if (createDto.driverId) {
        const driver = await tx.user.findUnique({
          where: { id: createDto.driverId },
        });
        if (!driver) {
          throw new NotFoundException(`Repartidor con ID ${createDto.driverId} no encontrado`);
        }
      }

      try {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(424244)`;
      } catch (err) {
        // Ignorar si el motor es mock en pruebas
      }

      const currentYear = new Date().getFullYear();
      const lastOrder = await tx.order.findFirst({
        where: { orderNumber: { startsWith: `PED-${currentYear}-` } },
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });

      let nextOrderNum = 1;
      if (lastOrder?.orderNumber) {
        const parts = lastOrder.orderNumber.split('-');
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) nextOrderNum = lastSeq + 1;
      }

      const countThisYear = await tx.order.count({
        where: {
          createdAt: {
            gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          },
        },
      });
      const nextOrderCorrelative = Math.max(nextOrderNum, countThisYear + 1);
      const orderNumber = `PED-${currentYear}-${String(nextOrderCorrelative).padStart(5, '0')}`;

      let subtotal = 0;
      const preparedItems: any[] = [];

      for (const itemDto of createDto.items) {
        const product = await tx.product.findFirst({
          where: { id: itemDto.productId, deletedAt: null },
        });
        if (!product) {
          throw new NotFoundException(`Producto con ID ${itemDto.productId} no encontrado`);
        }

        const unitPrice =
          itemDto.unitPrice !== undefined ? itemDto.unitPrice : Number(product.price);
        const totalPrice = unitPrice * itemDto.quantity;
        subtotal += totalPrice;

        preparedItems.push({
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice,
          totalPrice,
          product,
        });
      }

      const total = subtotal;
      const tax = Math.round((total - total / 1.18) * 100) / 100;
      const netSubtotal = total - tax;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: createDto.customerId,
          driverId: createDto.driverId,
          status: createDto.driverId ? OrderStatus.CONFIRMADO : OrderStatus.PENDIENTE,
          deliveryAddress: createDto.deliveryAddress,
          deliveryReference: createDto.deliveryReference?.trim(),
          latitude: createDto.latitude,
          longitude: createDto.longitude,
          scheduledDate: createDto.scheduledDate ? new Date(createDto.scheduledDate) : null,
          subtotal: netSubtotal,
          tax,
          total,
          notes: createDto.notes?.trim(),
          items: {
            create: preparedItems.map((p) => ({
              productId: p.productId,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              totalPrice: p.totalPrice,
            })),
          },
        },
        include: {
          customer: true,
          driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
          items: { include: { product: true } },
        },
      });

      if (createDto.driverId) {
        await tx.delivery.create({
          data: {
            orderId: order.id,
            driverId: createDto.driverId,
            status: DeliveryStatus.ASIGNADO,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_ORDER',
          entity: 'Order',
          entityId: order.id,
          newValues: {
            orderNumber: order.orderNumber,
            total,
            customerId: order.customerId,
            driverId: order.driverId,
          },
        },
      });

      return order;
    });
  }

  async findAll(filterDto: FilterOrderDto) {
    const {
      page = 1,
      limit = 20,
      search,
      customerId,
      driverId,
      status,
      startDate,
      endDate,
    } = filterDto;

    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { deliveryAddress: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { documentNumber: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (customerId) where.customerId = customerId;
    if (driverId) where.driverId = driverId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              documentNumber: true,
              phone: true,
              bottlesHolding: true,
              currentDebt: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  isReturnable: true,
                },
              },
            },
          },
          deliveries: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        items: {
          include: {
            product: true,
          },
        },
        deliveries: {
          include: {
            driver: { select: { firstName: true, lastName: true } },
          },
        },
        sales: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return order;
  }

  async assignDriver(id: string, assignDto: AssignDriverDto, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    const driver = await this.prisma.user.findUnique({
      where: { id: assignDto.driverId },
    });
    if (!driver) {
      throw new NotFoundException(`Repartidor con ID ${assignDto.driverId} no encontrado`);
    }

    return this.prisma.$transaction(async (tx) => {
      const nextStatus =
        order.status === OrderStatus.PENDIENTE ? OrderStatus.CONFIRMADO : order.status;

      const updated = await tx.order.update({
        where: { id },
        data: {
          driverId: assignDto.driverId,
          status: nextStatus,
        },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
          customer: true,
        },
      });

      // Crear o actualizar delivery
      await tx.delivery.create({
        data: {
          orderId: id,
          driverId: assignDto.driverId,
          status: DeliveryStatus.ASIGNADO,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'ASSIGN_DRIVER',
          entity: 'Order',
          entityId: id,
          newValues: { driverId: assignDto.driverId, status: nextStatus },
        },
      });

      return updated;
    });
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    const data: Prisma.OrderUpdateInput = {
      status: updateDto.status,
    };
    if (updateDto.notes) {
      data.notes = order.notes ? `${order.notes} | ${updateDto.notes}` : updateDto.notes;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data,
      });

      // Si pasa a EN_RUTA, actualizar la delivery
      if (updateDto.status === OrderStatus.EN_RUTA) {
        await tx.delivery.updateMany({
          where: { orderId: id, status: DeliveryStatus.ASIGNADO },
          data: {
            status: DeliveryStatus.EN_RUTA,
            departureAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_ORDER_STATUS',
          entity: 'Order',
          entityId: id,
          newValues: { status: updateDto.status, notes: updateDto.notes },
        },
      });

      return updated;
    });
  }

  async deliver(id: string, deliverDto: DeliverOrderDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      if (order.status === OrderStatus.ENTREGADO) {
        throw new BadRequestException('El pedido ya fue marcado como entregado anteriormente');
      }

      if (order.status === OrderStatus.CANCELADO) {
        throw new BadRequestException('No se puede entregar un pedido que fue cancelado');
      }

      // 1. Descontar Stock de los productos y generar Kardex
      let returnableCountInOrder = 0;
      for (const item of order.items) {
        const prod = item.product;
        if (prod.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente en almacén para el producto "${prod.name}". Disponible: ${prod.stock}, Requerido: ${item.quantity}`,
          );
        }

        const nextStock = prod.stock - item.quantity;
        await tx.product.update({
          where: { id: prod.id },
          data: { stock: nextStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: prod.id,
            movementType: InventoryMovementType.VENTA,
            quantity: -item.quantity,
            previousStock: prod.stock,
            newStock: nextStock,
            unitCost: Number(prod.cost),
            reason: `Entrega de pedido ${order.orderNumber} a domicilio`,
            referenceType: 'ORDER',
            referenceId: order.id,
            userId,
          },
        });

        if (prod.isReturnable) {
          returnableCountInOrder += item.quantity;
        }
      }

      const bottlesDelivered =
        deliverDto.bottlesDelivered !== undefined
          ? deliverDto.bottlesDelivered
          : returnableCountInOrder;
      const bottlesReturned = deliverDto.bottlesReturned || 0;
      const netBottleChange = bottlesDelivered - bottlesReturned;

      if (netBottleChange !== 0 || bottlesReturned > 0) {
        let newHolding = order.customer.bottlesHolding + netBottleChange;
        if (newHolding < 0) newHolding = 0;

        await tx.customer.update({
          where: { id: order.customerId },
          data: { bottlesHolding: newHolding },
        });

        await tx.bottleTransaction.create({
          data: {
            customerId: order.customerId,
            orderId: order.id,
            type:
              netBottleChange > 0
                ? BottleTransactionType.ENTREGA
                : BottleTransactionType.DEVOLUCION,
            quantity: Math.abs(netBottleChange),
            balanceAfter: newHolding,
            notes: `Entrega Pedido ${order.orderNumber}: entregó ${bottlesDelivered} bidón(es), recibió ${bottlesReturned} vacío(s)`,
            recordedById: userId,
          },
        });
      }

      // 2. Serialización transaccional de correlativo de venta con el mismo advisory lock que el POS (424242)
      try {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(424242)`;
      } catch (err) {
        // Ignorar si el motor es mock en pruebas
      }

      const currentYear = new Date().getFullYear();
      const lastSale = await tx.sale.findFirst({
        where: { saleNumber: { startsWith: `VTA-${currentYear}-` } },
        orderBy: { createdAt: 'desc' },
        select: { saleNumber: true },
      });

      let nextSaleNum = 1;
      if (lastSale?.saleNumber) {
        const parts = lastSale.saleNumber.split('-');
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) nextSaleNum = lastSeq + 1;
      }

      const countThisYear = await tx.sale.count({
        where: {
          createdAt: {
            gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          },
        },
      });
      const nextSaleCorrelative = Math.max(nextSaleNum, countThisYear + 1);
      const saleNumber = `VTA-${currentYear}-${String(nextSaleCorrelative).padStart(5, '0')}`;

      const total = Number(order.total);
      const saleType = deliverDto.saleType || SaleType.CONTADO;
      const paidAmount =
        saleType === SaleType.CONTADO
          ? deliverDto.paidAmount !== undefined
            ? Number(deliverDto.paidAmount)
            : total
          : deliverDto.paidAmount
          ? Number(deliverDto.paidAmount)
          : 0;
      const balanceDue = Math.max(0, total - paidAmount);

      let paymentStatus: PaymentStatus = PaymentStatus.PAGADO;
      if (saleType === SaleType.CREDITO) {
        if (paidAmount === 0) paymentStatus = PaymentStatus.PENDIENTE;
        else if (balanceDue > 0) paymentStatus = PaymentStatus.PARCIAL;
        else paymentStatus = PaymentStatus.PAGADO;

        if (balanceDue > 0) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: { currentDebt: { increment: balanceDue } },
          });
        }
      }

      // Buscar turno de caja activo para asignar el pago si aplica
      const activeShift = await tx.cashShift.findFirst({
        where: { status: CashShiftStatus.ABIERTA },
        orderBy: { openedAt: 'desc' },
      });

      const paymentMethod = deliverDto.paymentMethod || PaymentMethod.EFECTIVO;
      if (paidAmount > 0 && paymentMethod === PaymentMethod.EFECTIVO && !activeShift) {
        throw new BadRequestException(
          'No se puede recibir cobro en efectivo en la entrega porque la caja se encuentra cerrada. Debe aperturar un turno de caja previamente.',
        );
      }

      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: order.customerId,
          userId,
          orderId: order.id,
          saleType,
          paymentStatus,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          paidAmount,
          balanceDue,
          notes: deliverDto.notes?.trim() || `Venta generada por pedido a domicilio ${order.orderNumber}`,
          items: {
            create: order.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
            })),
          },
        },
      });

      // Registrar pago
      if (paidAmount > 0) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            shiftId: activeShift ? activeShift.id : null,
            receivedById: userId,
            amount: paidAmount,
            paymentMethod,
            operationCode: deliverDto.operationCode?.trim(),
          },
        });

        // Registrar ingreso en arqueo de caja si el pago fue en efectivo y hay turno abierto
        if (paymentMethod === PaymentMethod.EFECTIVO && activeShift) {
          await tx.cashMovement.create({
            data: {
              shiftId: activeShift.id,
              recordedById: userId,
              type: CashMovementType.INGRESO,
              amount: paidAmount,
              paymentMethod: PaymentMethod.EFECTIVO,
              reason: `Cobro en reparto de pedido ${order.orderNumber} - Cliente: ${order.customer.name}`,
              referenceType: 'ORDER',
              referenceId: order.id,
            },
          });
        }
      }

      await tx.delivery.updateMany({
        where: { orderId: id },
        data: {
          status: DeliveryStatus.ENTREGADO,
          arrivalAt: new Date(),
          bottlesDelivered,
          bottlesReturned,
          notes: deliverDto.notes?.trim(),
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.ENTREGADO,
          deliveredAt: new Date(),
        },
        include: {
          customer: true,
          driver: true,
          items: { include: { product: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELIVER_ORDER',
          entity: 'Order',
          entityId: order.id,
          newValues: {
            saleId: sale.id,
            saleNumber: sale.saleNumber,
            bottlesDelivered,
            bottlesReturned,
            paidAmount,
          },
        },
      });

      return {
        order: updatedOrder,
        sale,
        bottlesSummary: {
          delivered: bottlesDelivered,
          returned: bottlesReturned,
          newHolding: order.customer.bottlesHolding + netBottleChange,
        },
        message: `Pedido ${order.orderNumber} entregado con éxito. Se generó comprobante de venta ${sale.saleNumber}.`,
      };
    });
  }

  async getDrivers() {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.REPARTIDOR, Role.ADMIN, Role.SUPER_ADMIN, Role.VENDEDOR],
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }
}
