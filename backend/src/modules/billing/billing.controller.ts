import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { EmitInvoiceDto } from './dto/emit-invoice.dto';
import { FilterBillingDto } from './dto/filter-billing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Electronic Billing (SUNAT)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('emit')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CAJERO, Role.VENDEDOR)
  @ApiOperation({
    summary: 'Emitir Boleta o Factura Electrónica UBL 2.1 con validación SUNAT',
  })
  @ApiResponse({ status: 201, description: 'Comprobante emitido y validado exitosamente' })
  emit(
    @Body() emitDto: EmitInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.emit(emitDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar comprobantes electrónicos emitidos' })
  findAll(@Query() filterDto: FilterBillingDto) {
    return this.billingService.findAll(filterDto);
  }

  @Get('uninvoiced-sales')
  @ApiOperation({ summary: 'Listar ventas que aún no han sido facturadas' })
  getUninvoicedSales(@Query('limit') limit?: number) {
    return this.billingService.getUninvoicedSales(limit ? Number(limit) : 50);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de comprobante electrónico' })
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Get(':id/ticket')
  @ApiOperation({ summary: 'Obtener datos formateados para impresión de Ticket 80mm' })
  getTicketData(@Param('id') id: string) {
    return this.billingService.getTicketData(id);
  }
}
