import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { FilterReceivablesDto } from './dto/filter-receivables.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Payments & Receivables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('receivables')
  @ApiOperation({
    summary: 'Listar cuentas por cobrar con métricas de deuda global y días de mora',
  })
  getReceivables(@Query() filterDto: FilterReceivablesDto) {
    return this.paymentsService.getReceivables(filterDto);
  }

  @Post('collect')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CAJERO, Role.VENDEDOR, Role.REPARTIDOR)
  @ApiOperation({
    summary: 'Registrar cobro / amortización a una venta a crédito con ingreso a caja',
  })
  @ApiResponse({ status: 201, description: 'Cobro registrado atómicamente con éxito' })
  collect(
    @Body() collectDto: CollectPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.collect(collectDto, userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historial de pagos y amortizaciones recibidas' })
  getHistory(@Query('limit') limit?: number) {
    return this.paymentsService.getHistory(limit ? Number(limit) : 50);
  }
}
