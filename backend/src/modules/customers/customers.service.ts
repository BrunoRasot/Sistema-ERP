import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomerDto } from './dto/filter-customer.dto';
import { RegisterBottleTransactionDto } from './dto/register-bottle-transaction.dto';
import { BottleTransactionType, Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCustomerDto, userId?: string) {
    const existing = await this.prisma.customer.findUnique({
      where: { documentNumber: createDto.documentNumber.trim() },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        `Ya existe un cliente registrado con el documento ${createDto.documentNumber}`,
      );
    }

    const customer = await this.prisma.customer.create({
      data: {
        documentType: createDto.documentType,
        documentNumber: createDto.documentNumber.trim(),
        name: createDto.name.trim(),
        businessName: createDto.businessName?.trim(),
        phone: createDto.phone.trim(),
        whatsapp: createDto.whatsapp ? createDto.whatsapp.trim() : createDto.phone.trim(),
        email: createDto.email?.trim().toLowerCase(),
        address: createDto.address.trim(),
        reference: createDto.reference?.trim(),
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        customerType: createDto.customerType || 'HOGAR',
        creditLimit: createDto.creditLimit || 0,
        zone: createDto.zone?.trim(),
        district: createDto.district?.trim(),
        subchannel: createDto.subchannel?.trim(),
        notes: createDto.notes?.trim(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CUSTOMER',
        entity: 'Customer',
        entityId: customer.id,
        newValues: customer as any,
      },
    });

    return customer;
  }

  async findAll(filterDto: FilterCustomerDto) {
    const { page = 1, limit = 20, search, customerType, loyaltyTier, withBottlesPending } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
    };

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { documentNumber: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { businessName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { whatsapp: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (customerType) {
      where.customerType = customerType;
    }

    if (loyaltyTier) {
      where.loyaltyTier = loyaltyTier;
    }

    if (withBottlesPending) {
      where.bottlesHolding = { gt: 0 };
    }

    const [total, items] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            sales: true,
            orders: true,
            bottleTransactions: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    // Calcular métricas de compra
    const salesSummary = await this.prisma.sale.aggregate({
      where: { customerId: id },
      _sum: { total: true },
      _count: { id: true },
    });

    const lastSale = await this.prisma.sale.findFirst({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, total: true, saleNumber: true },
    });

    const totalSpent = Number(salesSummary._sum.total || 0);
    const purchaseCount = salesSummary._count.id;
    const averageTicket = purchaseCount > 0 ? totalSpent / purchaseCount : 0;

    return {
      ...customer,
      metrics: {
        totalSpent,
        purchaseCount,
        averageTicket,
        lastPurchase: lastSale ? lastSale.createdAt : null,
        bottlesHolding: customer.bottlesHolding,
        currentDebt: Number(customer.currentDebt),
        creditLimit: Number(customer.creditLimit),
      },
    };
  }

  async update(id: string, updateDto: UpdateCustomerDto, userId?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    if (updateDto.documentNumber && updateDto.documentNumber !== customer.documentNumber) {
      const duplicate = await this.prisma.customer.findUnique({
        where: { documentNumber: updateDto.documentNumber.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `El documento ${updateDto.documentNumber} ya pertenece a otro cliente`,
        );
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        documentType: updateDto.documentType,
        documentNumber: updateDto.documentNumber?.trim(),
        name: updateDto.name?.trim(),
        businessName: updateDto.businessName?.trim(),
        phone: updateDto.phone?.trim(),
        whatsapp: updateDto.whatsapp?.trim(),
        email: updateDto.email?.trim().toLowerCase(),
        address: updateDto.address?.trim(),
        reference: updateDto.reference?.trim(),
        latitude: updateDto.latitude,
        longitude: updateDto.longitude,
        customerType: updateDto.customerType,
        creditLimit: updateDto.creditLimit,
        zone: updateDto.zone !== undefined ? updateDto.zone?.trim() : undefined,
        district: updateDto.district !== undefined ? updateDto.district?.trim() : undefined,
        subchannel: updateDto.subchannel !== undefined ? updateDto.subchannel?.trim() : undefined,
        notes: updateDto.notes?.trim(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_CUSTOMER',
        entity: 'Customer',
        entityId: id,
        oldValues: customer as any,
        newValues: updated as any,
      },
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    if (customer.bottlesHolding > 0) {
      throw new BadRequestException(
        `No se puede eliminar el cliente porque aún tiene ${customer.bottlesHolding} bidón(es) pendiente(s) de devolver. Registre la devolución o pérdida primero.`,
      );
    }

    if (Number(customer.currentDebt) > 0) {
      throw new BadRequestException(
        `No se puede eliminar el cliente porque mantiene una deuda pendiente de S/ ${customer.currentDebt}.`,
      );
    }

    const softDeleted = await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_CUSTOMER',
        entity: 'Customer',
        entityId: id,
      },
    });

    return { message: 'Cliente dado de baja correctamente' };
  }

  // GESTIÓN DE BIDONES RETORNABLES (ENVASES)

  async registerBottleTransaction(
    customerId: string,
    dto: RegisterBottleTransactionDto,
    recordedById?: string,
  ) {
    const { type, quantity, notes, orderId, saleId } = dto;

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, deletedAt: null },
      });

      if (!customer) {
        throw new NotFoundException(`Cliente con ID ${customerId} no encontrado`);
      }

      let newHolding = customer.bottlesHolding;

      switch (type) {
        case BottleTransactionType.ENTREGA:
          newHolding += quantity;
          break;
        case BottleTransactionType.DEVOLUCION:
          if (quantity > customer.bottlesHolding) {
            this.logger.warn(
              `Cliente devolvió ${quantity} bidones pero solo tenía registrados ${customer.bottlesHolding}. Se ajustará a 0.`,
            );
            newHolding = 0;
          } else {
            newHolding -= quantity;
          }
          break;
        case BottleTransactionType.PERDIDA:
        case BottleTransactionType.DANADO:
          newHolding = Math.max(0, newHolding - quantity);
          break;
        case BottleTransactionType.AJUSTE:
          // En ajuste, se recalcula la custodia
          newHolding = quantity;
          break;
      }

      const transaction = await tx.bottleTransaction.create({
        data: {
          customerId,
          type,
          quantity,
          balanceAfter: newHolding,
          notes: notes?.trim(),
          orderId,
          saleId,
          recordedById,
        },
        include: {
          recordedBy: {
            select: { firstName: true, lastName: true, role: true },
          },
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { bottlesHolding: newHolding },
      });

      await tx.auditLog.create({
        data: {
          userId: recordedById,
          action: 'REGISTER_BOTTLE_TRANSACTION',
          entity: 'Customer',
          entityId: customerId,
          oldValues: { bottlesHolding: customer.bottlesHolding },
          newValues: {
            bottlesHolding: newHolding,
            transactionType: type,
            quantity,
          },
        },
      });

      return {
        transaction,
        customerBottlesHolding: newHolding,
        message: `Movimiento de bidones registrado exitosamente. Saldo actual del cliente: ${newHolding} bidón(es).`,
      };
    });
  }

  async getBottleHistory(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, bottlesHolding: true },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente no encontrado`);
    }

    const history = await this.prisma.bottleTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        recordedBy: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });

    return {
      customer,
      history,
    };
  }
}
