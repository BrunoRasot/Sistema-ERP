import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { DeliverOrderDto } from './dto/deliver-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Orders & Logistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.VENDEDOR, Role.CAJERO)
  @ApiOperation({ summary: 'Crear nuevo pedido a domicilio programado o inmediato' })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos con filtros de estado, repartidor y fecha' })
  findAll(@Query() filterDto: FilterOrderDto) {
    return this.ordersService.findAll(filterDto);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Obtener lista de personal y repartidores asignables' })
  getDrivers() {
    return this.ordersService.getDrivers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de un pedido' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/assign-driver')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.VENDEDOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Asignar chofer/repartidor a un pedido' })
  assignDriver(
    @Param('id') id: string,
    @Body() assignDto: AssignDriverDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.assignDriver(id, assignDto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.VENDEDOR, Role.REPARTIDOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar estado del pedido (PREPARANDO, EN_RUTA, CANCELADO)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.updateStatus(id, updateDto, userId);
  }

  @Post(':id/deliver')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REPARTIDOR, Role.VENDEDOR)
  @ApiOperation({
    summary: 'Completar entrega en destino con cobro, recojo de bidones y generación de venta',
  })
  deliver(
    @Param('id') id: string,
    @Body() deliverDto: DeliverOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.deliver(id, deliverDto, userId);
  }
}
