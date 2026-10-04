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
import { CashService } from './cash.service';
import { OpenCashShiftDto, CloseCashShiftDto } from './dto/cash-shift.dto';
import { CreateCashMovementDto } from './dto/cash-movement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Cash & Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('registers')
  @ApiOperation({ summary: 'Listar todas las cajas registradas y su turno activo' })
  getCashRegisters() {
    return this.cashService.getCashRegisters();
  }

  @Get('shifts/active')
  @ApiOperation({ summary: 'Obtener el turno de caja abierto actualmente con balance en tiempo real' })
  getActiveShift(@Query('cashRegisterId') cashRegisterId?: string) {
    return this.cashService.getActiveShift(cashRegisterId);
  }

  @Get('shifts/history')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPERVISOR, Role.CAJERO)
  @ApiOperation({ summary: 'Historial de turnos y cierres de caja con arqueo' })
  getShiftHistory(
    @Query('cashRegisterId') cashRegisterId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cashService.getShiftHistory(
      cashRegisterId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      startDate,
      endDate,
    );
  }

  @Post('shifts/open')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CAJERO, Role.VENDEDOR)
  @ApiOperation({ summary: 'Aperturar un nuevo turno de caja con saldo inicial' })
  openShift(@Body() dto: OpenCashShiftDto, @CurrentUser('id') userId: string) {
    return this.cashService.openShift(dto, userId);
  }

  @Post('shifts/:id/close')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CAJERO, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Cerrar turno de caja con arqueo de efectivo y cálculo de diferencias' })
  closeShift(
    @Param('id') shiftId: string,
    @Body() dto: CloseCashShiftDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.cashService.closeShift(shiftId, dto, userId);
  }

  @Post('movements')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CAJERO, Role.VENDEDOR)
  @ApiOperation({ summary: 'Registrar un movimiento manual de caja (Gasto o Ingreso)' })
  createMovement(
    @Body() dto: CreateCashMovementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.cashService.createMovement(dto, userId);
  }
}
