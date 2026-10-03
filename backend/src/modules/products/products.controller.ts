import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Products & Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ALMACENERO)
  @ApiOperation({ summary: 'Crear un nuevo producto en catálogo' })
  @ApiResponse({ status: 201, description: 'Producto creado y Kardex inicial registrado' })
  @ApiResponse({ status: 409, description: 'Código SKU ya existente' })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.create(createProductDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos con paginación, filtros de categoría y stock crítico' })
  findAll(@Query() filterDto: FilterProductDto) {
    return this.productsService.findAll(filterDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías activas' })
  getCategories() {
    return this.productsService.getCategories();
  }

  @Post('categories')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Crear una nueva categoría de productos' })
  createCategory(@Body('name') name: string, @Body('description') description?: string) {
    return this.productsService.createCategory(name, description);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un producto con sus últimos movimientos de stock' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ALMACENERO)
  @ApiOperation({ summary: 'Actualizar precios, costos o datos de un producto' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.update(id, updateProductDto, userId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar de baja (soft-delete) un producto' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.productsService.remove(id, userId);
  }
}
