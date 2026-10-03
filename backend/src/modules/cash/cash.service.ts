import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OpenCashShiftDto, CloseCashShiftDto } from './dto/cash-shift.dto';
import { CreateCashMovementDto } from './dto/cash-movement.dto';
import { CashShiftStatus, CashMovementType, PaymentMethod } from '@prisma/client';

@Injectable()
export class CashService {
  private readonly logger = new Logger(CashService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCashRegisters() {
    return this.prisma.cashRegister.findMany({
      where: { status: 'ACTIVE' },
      include: {
        shifts: {
          where: { status: CashShiftStatus.ABIERTA },
          take: 1,
          include: {
            openedBy: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });
  }

  async getActiveShift(cashRegisterId?: string) {
    const where: any = { status: CashShiftStatus.ABIERTA };
    if (cashRegisterId) {
      where.cashRegisterId = cashRegisterId;
    }

    const shift = await this.prisma.cashShift.findFirst({
      where,
      orderBy: { openedAt: 'desc' },
      include: {
        cashRegister: true,
        openedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          include: { recordedBy: { select: { firstName: true, lastName: true } } },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            sale: {
              select: {
                id: true,
                saleNumber: true,
                customer: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!shift) {
      return null;
    }

    // Calcular totales desglosados por método de pago
    let cashSalesTotal = 0;
    let yapePlinSalesTotal = 0;
    let cardSalesTotal = 0;
    let transferSalesTotal = 0;

    for (const payment of shift.payments) {
      const amount = Number(payment.amount);
      if (payment.paymentMethod === PaymentMethod.EFECTIVO) {
        cashSalesTotal += amount;
      } else if (payment.paymentMethod === PaymentMethod.YAPE || payment.paymentMethod === PaymentMethod.PLIN) {
        yapePlinSalesTotal += amount;
      } else if (payment.paymentMethod === PaymentMethod.TARJETA) {
        cardSalesTotal += amount;
      } else if (payment.paymentMethod === PaymentMethod.TRANSFERENCIA) {
        transferSalesTotal += amount;
      }
    }

    // Movimientos manuales
    let manualIncomes = 0;
    let manualExpenses = 0;

    for (const mov of shift.movements) {
      const amount = Number(mov.amount);
      if (mov.type === CashMovementType.INGRESO) {
        manualIncomes += amount;
      } else {
        manualExpenses += amount;
      }
    }

    const initial = Number(shift.initialBalance);
    const expectedCashInBox = initial + cashSalesTotal + manualIncomes - manualExpenses;
    const totalSalesAllMethods = cashSalesTotal + yapePlinSalesTotal + cardSalesTotal + transferSalesTotal;

    return {
      ...shift,
      summary: {
        initialBalance: initial,
        cashSalesTotal,
        yapePlinSalesTotal,
        cardSalesTotal,
        transferSalesTotal,
        totalSalesAllMethods,
        manualIncomes,
        manualExpenses,
        expectedCashInBox,
      },
    };
  }

  async openShift(dto: OpenCashShiftDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.cashShift.findFirst({
        where: {
          cashRegisterId: dto.cashRegisterId,
          status: CashShiftStatus.ABIERTA,
        },
      });

      if (existing) {
        throw new ConflictException('Esta caja ya cuenta con un turno abierto actualmente.');
      }

      const shift = await tx.cashShift.create({
        data: {
          cashRegisterId: dto.cashRegisterId,
          openedById: userId,
          initialBalance: dto.initialBalance,
          notes: dto.notes?.trim(),
          status: CashShiftStatus.ABIERTA,
        },
        include: {
          cashRegister: true,
          openedBy: { select: { firstName: true, lastName: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'OPEN_CASH_SHIFT',
          entity: 'CashShift',
          entityId: shift.id,
          newValues: {
            cashRegisterId: dto.cashRegisterId,
            initialBalance: dto.initialBalance,
          },
        },
      });

      return shift;
    });
  }

  async closeShift(shiftId: string, dto: CloseCashShiftDto, userId: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: {
        payments: true,
        movements: true,
      },
    });

    if (!shift) {
      throw new NotFoundException('Turno de caja no encontrado');
    }

    if (shift.status === CashShiftStatus.CERRADA) {
      throw new BadRequestException('Este turno de caja ya ha sido cerrado previamente.');
    }

    // Calcular saldo esperado en efectivo
    let cashSales = 0;
    for (const p of shift.payments) {
      if (p.paymentMethod === PaymentMethod.EFECTIVO) {
        cashSales += Number(p.amount);
      }
    }

    let manualIncomes = 0;
    let manualExpenses = 0;
    for (const m of shift.movements) {
      if (m.paymentMethod === PaymentMethod.EFECTIVO) {
        if (m.type === CashMovementType.INGRESO) manualIncomes += Number(m.amount);
        else manualExpenses += Number(m.amount);
      }
    }

    const expectedBalance = Number(shift.initialBalance) + cashSales + manualIncomes - manualExpenses;
    const difference = dto.actualBalance - expectedBalance;

    const closed = await this.prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        status: CashShiftStatus.CERRADA,
        closedById: userId,
        closedAt: new Date(),
        expectedBalance,
        actualBalance: dto.actualBalance,
        difference,
        notes: dto.notes ? `${shift.notes || ''} | Cierre: ${dto.notes}` : shift.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CLOSE_CASH_SHIFT',
        entity: 'CashShift',
        entityId: shiftId,
        newValues: {
          expectedBalance,
          actualBalance: dto.actualBalance,
          difference,
        },
      },
    });

    return {
      shift: closed,
      expectedBalance,
      actualBalance: dto.actualBalance,
      difference,
      message:
        difference === 0
          ? 'Caja cuadrada exactamente sin diferencias.'
          : difference > 0
          ? `Cierre con sobrante de S/ ${difference.toFixed(2)}.`
          : `Cierre con faltante de S/ ${Math.abs(difference).toFixed(2)}.`,
    };
  }

  async createMovement(dto: CreateCashMovementDto, userId: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: dto.shiftId },
    });

    if (!shift || shift.status !== CashShiftStatus.ABIERTA) {
      throw new BadRequestException('El turno de caja no existe o se encuentra cerrado.');
    }

    const movement = await this.prisma.cashMovement.create({
      data: {
        shiftId: dto.shiftId,
        type: dto.type,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod || PaymentMethod.EFECTIVO,
        reason: dto.reason.trim(),
        recordedById: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CASH_MOVEMENT',
        entity: 'CashMovement',
        entityId: movement.id,
        newValues: movement as any,
      },
    });

    return movement;
  }
}
