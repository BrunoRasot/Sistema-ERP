import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { FilterSaleDto } from './dto/filter-sale.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Sales & POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.VENDEDOR, Role.CAJERO, Role.REPARTIDOR)
  @ApiOperation({
    summary: 'Registrar una venta con descuento de Kardex, custodia de bidones e ingreso a caja',
  })
  @ApiResponse({ status: 201, description: 'Venta registrada atómicamente con éxito' })
  create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesService.create(createSaleDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas con filtros de fecha, cliente y estado de pago' })
  findAll(@Query() filterDto: FilterSaleDto) {
    return this.salesService.findAll(filterDto);
  }

  @Get('export/excel')
  @ApiOperation({
    summary: 'Exportar registro de ventas en Excel con formato oficial (Zona, Distrito, 20L, 7L)',
  })
  async exportExcel(@Query() filterDto: FilterSaleDto, @Res() res: Response) {
    const buffer = await this.salesService.exportSalesExcel(filterDto);
    const fileName = `registro_ventas_vivelite_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de venta con ítems y pagos' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}

