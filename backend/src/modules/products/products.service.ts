import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { InventoryMovementType, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProductDto, userId?: string) {
    const existing = await this.prisma.product.findUnique({
      where: { code: createDto.code.trim().toUpperCase() },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        `Ya existe un producto registrado con el código SKU ${createDto.code}`,
      );
    }

    const initialStock = createDto.stock || 0;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          code: createDto.code.trim().toUpperCase(),
          name: createDto.name.trim(),
          description: createDto.description?.trim(),
          categoryId: createDto.categoryId,
          price: createDto.price,
          cost: createDto.cost,
          unit: createDto.unit || 'UNIDAD',
          stock: initialStock,
          minStock: createDto.minStock !== undefined ? createDto.minStock : 10,
          isReturnable: createDto.isReturnable || false,
          imageUrl: createDto.imageUrl,
          status: createDto.status || 'ACTIVE',
        },
        include: {
          category: true,
        },
      });

      // Si se ingresó stock inicial, registrar en el Kardex
      if (initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            movementType: InventoryMovementType.ENTRADA,
            quantity: initialStock,
            previousStock: 0,
            newStock: initialStock,
            unitCost: createDto.cost,
            reason: 'Inventario inicial al crear producto',
            referenceType: 'INITIAL_STOCK',
            userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_PRODUCT',
          entity: 'Product',
          entityId: product.id,
          newValues: product as any,
        },
      });

      return product;
    });
  }

  async findAll(filterDto: FilterProductDto) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      unit,
      isReturnable,
      isLowStock,
      status,
    } = filterDto;

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (unit) {
      where.unit = unit;
    }

    if (isReturnable !== undefined) {
      where.isReturnable = isReturnable;
    }

    if (status) {
      where.status = status;
    }

    // Filtro para productos en alerta de stock crítico
    if (isLowStock) {
      where.stock = {
        lte: this.prisma.product.fields.minStock,
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isReturnable: 'desc' }, { name: 'asc' }],
        include: {
          category: {
            select: { id: true, name: true },
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
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    const isLowStock = product.stock <= product.minStock;

    return {
      ...product,
      isLowStock,
      stockValueAtCost: Number(product.cost) * product.stock,
      stockValueAtPrice: Number(product.price) * product.stock,
    };
  }

  async update(id: string, updateDto: UpdateProductDto, userId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    if (updateDto.code && updateDto.code.toUpperCase() !== product.code) {
      const duplicate = await this.prisma.product.findUnique({
        where: { code: updateDto.code.trim().toUpperCase() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `El código ${updateDto.code} ya está asignado a otro producto`,
        );
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        code: updateDto.code?.trim().toUpperCase(),
        name: updateDto.name?.trim(),
        description: updateDto.description?.trim(),
        categoryId: updateDto.categoryId,
        price: updateDto.price,
        cost: updateDto.cost,
        unit: updateDto.unit,
        minStock: updateDto.minStock,
        isReturnable: updateDto.isReturnable,
        imageUrl: updateDto.imageUrl,
        status: updateDto.status,
      },
      include: {
        category: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_PRODUCT',
        entity: 'Product',
        entityId: id,
        oldValues: product as any,
        newValues: updated as any,
      },
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { saleItems: true, orderItems: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    if (product._count.saleItems > 0 || product._count.orderItems > 0) {
      // Si tiene ventas históricas, aplicamos soft-delete seguro
      await this.prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'INACTIVE',
        },
      });
    } else {
      await this.prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'INACTIVE',
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_PRODUCT',
        entity: 'Product',
        entityId: id,
      },
    });

    return { message: 'Producto dado de baja correctamente' };
  }

  // CATEGORÍAS

  async getCategories() {
    return this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });
  }

  async createCategory(name: string, description?: string) {
    const existing = await this.prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una categoría llamada "${name}"`);
    }

    return this.prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
      },
    });
  }
}
