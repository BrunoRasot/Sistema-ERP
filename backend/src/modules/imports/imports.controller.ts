import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ImportsService } from './imports.service';
import { ImportFileDto } from './dto/import-data.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Data Import (Excel/CSV)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('templates/:type')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Descargar plantilla oficial en formato Excel (.xlsx)' })
  downloadTemplate(
    @Param('type') type: 'customers' | 'products',
    @Res() res: Response,
  ) {
    const buffer = this.importsService.generateTemplate(type);
    const fileName = `plantilla_vivelite_${type}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post('customers')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({
    summary: 'Importar clientes y saldos históricos de bidones desde archivo Excel o CSV',
  })
  @ApiResponse({ status: 200, description: 'Resultado de la migración con conteo de éxitos y errores' })
  importCustomers(
    @Body() dto: ImportFileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.importsService.importCustomers(dto, userId);
  }

  @Post('products')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({
    summary: 'Importar catálogo de productos y stock inicial de almacén desde Excel o CSV',
  })
  @ApiResponse({ status: 200, description: 'Resultado de la migración de productos' })
  importProducts(
    @Body() dto: ImportFileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.importsService.importProducts(dto, userId);
  }
}
