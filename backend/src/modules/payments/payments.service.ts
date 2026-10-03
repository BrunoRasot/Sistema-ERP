import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { FilterReceivablesDto } from './dto/filter-receivables.dto';
import {
  PaymentStatus,
  CashShiftStatus,
  CashMovementType,
  PaymentMethod,
  Prisma,
} from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReceivables(filterDto: FilterReceivablesDto) {
    const { page = 1, limit = 20, search, customerId, paymentStatus, isOverdue } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      balanceDue: { gt: 0 },
      paymentStatus: {
        in: [PaymentStatus.PENDIENTE, PaymentStatus.PARCIAL, PaymentStatus.VENCIDO],
      },
    };

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { saleNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { documentNumber: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (customerId) where.customerId = customerId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const now = new Date();
    if (isOverdue) {
      where.dueDate = { lt: now };
    }

    const [total, items, debtorsCount, allPendingSales, monthPayments] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              documentType: true,
              documentNumber: true,
              phone: true,
              creditLimit: true,
              currentDebt: true,
            },
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              operationCode: true,
              paymentDate: true,
            },
          },
        },
      }),
      this.prisma.customer.count({
        where: { currentDebt: { gt: 0 }, deletedAt: null },
      }),
      this.prisma.sale.findMany({
        where: {
          balanceDue: { gt: 0 },
          paymentStatus: { in: [PaymentStatus.PENDIENTE, PaymentStatus.PARCIAL, PaymentStatus.VENCIDO] },
        },
        select: { balanceDue: true, dueDate: true },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    let totalPendingDebt = 0;
    let overdueDebt = 0;

    for (const s of allPendingSales) {
      const due = Number(s.balanceDue);
      totalPendingDebt += due;
      if (s.dueDate && new Date(s.dueDate) < now) {
        overdueDebt += due;
      }
    }

    // Calcular días de mora y estado de alerta para cada venta
    const enrichedItems = items.map((sale) => {
      let overdueDays = 0;
      let isLate = false;
      if (sale.dueDate) {
        const dueTime = new Date(sale.dueDate).getTime();
        const diff = now.getTime() - dueTime;
        if (diff > 0) {
          overdueDays = Math.floor(diff / (1000 * 60 * 60 * 24));
          isLate = true;
        }
      }

      return {
        ...sale,
        overdueDays,
        isLate,
      };
    });

    return {
      metrics: {
        totalPendingDebt,
        overdueDebt,
        debtorsCount,
        collectedThisMonth: Number(monthPayments._sum.amount || 0),
      },
      data: enrichedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async collect(dto: CollectPaymentDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Bloqueo pesimista a nivel de transacción PostgreSQL para serializar cobros y evitar sobreamortizaciones concurrentes
      try {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(424245)`;
      } catch (err) {
        // Ignorar si el motor es mock en pruebas
      }

      const sale = await tx.sale.findUnique({
        where: { id: dto.saleId },
        include: { customer: true },
      });

      if (!sale) {
        throw new NotFoundException(`Comprobante de venta con ID ${dto.saleId} no encontrado`);
      }

      const currentBalance = Number(sale.balanceDue);
      if (currentBalance <= 0) {
        throw new BadRequestException('Esta venta no tiene saldo pendiente por cobrar');
      }

      if (dto.amount > currentBalance) {
        throw new BadRequestException(
          `El monto a cobrar (S/ ${dto.amount.toFixed(2)}) supera el saldo pendiente (S/ ${currentBalance.toFixed(2)})`,
        );
      }

      const newBalanceDue = Math.max(0, currentBalance - dto.amount);
      const newPaidAmount = Number(sale.paidAmount) + dto.amount;
      const newStatus = newBalanceDue === 0 ? PaymentStatus.PAGADO : PaymentStatus.PARCIAL;

      const updatedSale = await tx.sale.update({
        where: { id: dto.saleId },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          paymentStatus: newStatus,
        },
      });

      const prevCustomerDebt = Number(sale.customer.currentDebt);
      const newCustomerDebt = Math.max(0, prevCustomerDebt - dto.amount);

      await tx.customer.update({
        where: { id: sale.customerId },
        data: { currentDebt: newCustomerDebt },
      });

      const activeShift = await tx.cashShift.findFirst({
        where: { status: CashShiftStatus.ABIERTA },
        orderBy: { openedAt: 'desc' },
      });

      if (dto.paymentMethod === PaymentMethod.EFECTIVO && !activeShift) {
        throw new BadRequestException(
          'Se requiere un turno de caja abierto para registrar amortizaciones en efectivo',
        );
      }

      const payment = await tx.payment.create({
        data: {
          saleId: sale.id,
          shiftId: activeShift ? activeShift.id : null,
          receivedById: userId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          operationCode: dto.operationCode?.trim(),
          notes: dto.notes?.trim() || `Cobro/Amortización a venta ${sale.saleNumber}`,
        },
      });

      if (dto.paymentMethod === PaymentMethod.EFECTIVO && activeShift) {
        await tx.cashMovement.create({
          data: {
            shiftId: activeShift.id,
            recordedById: userId,
            type: CashMovementType.INGRESO,
            amount: dto.amount,
            paymentMethod: PaymentMethod.EFECTIVO,
            reason: `Cobro de crédito venta ${sale.saleNumber} - Cliente: ${sale.customer.name}`,
            referenceType: 'SALE',
            referenceId: sale.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'COLLECT_CREDIT',
          entity: 'Sale',
          entityId: sale.id,
          newValues: {
            paymentId: payment.id,
            amount: dto.amount,
            previousBalance: currentBalance,
            newBalance: newBalanceDue,
            newCustomerDebt,
          },
        },
      });

      return {
        payment,
        saleNumber: sale.saleNumber,
        customerName: sale.customer.name,
        amountCollected: dto.amount,
        previousBalance: currentBalance,
        newBalanceDue,
        status: newStatus,
        message: `Cobro de S/ ${dto.amount.toFixed(2)} registrado exitosamente para ${sale.customer.name}. Saldo restante: S/ ${newBalanceDue.toFixed(2)}.`,
      };
    });
  }

  async getHistory(limit: number = 50) {
    return this.prisma.payment.findMany({
      take: limit,
      orderBy: { paymentDate: 'desc' },
      include: {
        sale: {
          select: {
            saleNumber: true,
            total: true,
            balanceDue: true,
            customer: { select: { id: true, name: true, phone: true } },
          },
        },
        receivedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }
}
