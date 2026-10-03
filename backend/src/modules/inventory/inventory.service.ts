import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RegisterMovementDto } from './dto/register-movement.dto';
import { FilterKardexDto } from './dto/filter-kardex.dto';
import { InventoryMovementType, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerMovement(dto: RegisterMovementDto, userId?: string) {
    const { productId, movementType, quantity, unitCost, reason, referenceType, referenceId } = dto;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, deletedAt: null },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
      }

      const previousStock = product.stock;
      let newStock = previousStock;
      let appliedQuantity = quantity;

      switch (movementType) {
        case InventoryMovementType.ENTRADA:
        case InventoryMovementType.COMPRA:
        case InventoryMovementType.DEVOLUCION:
          newStock = previousStock + quantity;
          break;

        case InventoryMovementType.SALIDA:
        case InventoryMovementType.MERMA:
          if (quantity > previousStock) {
            throw new BadRequestException(
              `Stock insuficiente para salida. Stock actual: ${previousStock}, cantidad solicitada: ${quantity}`,
            );
          }
          newStock = previousStock - quantity;
          appliedQuantity = -quantity;
          break;

        case InventoryMovementType.AJUSTE:
          // En conteo físico, la cantidad representa el nuevo stock real en estantería
          newStock = quantity;
          appliedQuantity = quantity - previousStock;
          break;

        default:
          throw new BadRequestException(`Tipo de movimiento no compatible`);
      }

      const effectiveCost = unitCost !== undefined ? unitCost : Number(product.cost);

      // 1. Crear el registro en Kardex
      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          movementType,
          quantity: appliedQuantity,
          previousStock,
          newStock,
          unitCost: effectiveCost,
          reason: reason.trim(),
          referenceType: referenceType || 'MANUAL',
          referenceId,
          userId,
        },
        include: {
          product: {
            select: { id: true, code: true, name: true, unit: true },
          },
          user: {
            select: { firstName: true, lastName: true, role: true },
          },
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'REGISTER_INVENTORY_MOVEMENT',
          entity: 'Product',
          entityId: productId,
          oldValues: { stock: previousStock },
          newValues: {
            stock: newStock,
            movementType,
            quantity: appliedQuantity,
            reason,
          },
        },
      });

      return {
        movement,
        previousStock,
        newStock,
        message: `Movimiento de Kardex registrado exitosamente. Stock actualizado de ${previousStock} a ${newStock} unidades.`,
      };
    });
  }

  async getKardex(filterDto: FilterKardexDto) {
    const { page = 1, limit = 20, productId, movementType, startDate, endDate } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, code: true, name: true, unit: true, isReturnable: true },
          },
          user: {
            select: { firstName: true, lastName: true, role: true },
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

  async getInventorySummary() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        minStock: true,
        cost: true,
        price: true,
        isReturnable: true,
      },
    });

    let totalItems = 0;
    let totalStockUnits = 0;
    let totalReturnableBottlesInPlant = 0;
    let totalValuedAtCost = 0;
    let totalValuedAtPrice = 0;
    let lowStockCount = 0;

    const criticalProducts: any[] = [];

    for (const p of products) {
      totalItems += 1;
      totalStockUnits += p.stock;
      if (p.isReturnable) {
        totalReturnableBottlesInPlant += p.stock;
      }
      totalValuedAtCost += Number(p.cost) * p.stock;
      totalValuedAtPrice += Number(p.price) * p.stock;

      if (p.stock <= p.minStock) {
        lowStockCount += 1;
        criticalProducts.push({
          id: p.id,
          code: p.code,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          isReturnable: p.isReturnable,
        });
      }
    }

    return {
      totalSkus: totalItems,
      totalUnitsInWarehouse: totalStockUnits,
      returnableUnitsInWarehouse: totalReturnableBottlesInPlant,
      totalValuedAtCost: Math.round(totalValuedAtCost * 100) / 100,
      totalValuedAtPrice: Math.round(totalValuedAtPrice * 100) / 100,
      lowStockCount,
      criticalProducts,
    };
  }
}
