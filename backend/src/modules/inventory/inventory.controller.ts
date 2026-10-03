import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { RegisterMovementDto } from './dto/register-movement.dto';
import { FilterKardexDto } from './dto/filter-kardex.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory & Kardex')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('movements')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ALMACENERO, Role.SUPERVISOR)
  @ApiOperation({
    summary: 'Registrar movimiento en Kardex (Entrada producción, Salida merma, Ajuste de conteo físico)',
  })
  @ApiResponse({ status: 201, description: 'Movimiento registrado y stock actualizado atómicamente' })
  registerMovement(
    @Body() dto: RegisterMovementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.registerMovement(dto, userId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Consultar historial de Kardex paginado por producto, fechas o tipo' })
  getKardex(@Query() filterDto: FilterKardexDto) {
    return this.inventoryService.getKardex(filterDto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Obtener resumen ejecutivo e inventario valorizado en soles (costo y venta)' })
  getInventorySummary() {
    return this.inventoryService.getInventorySummary();
  }
}
