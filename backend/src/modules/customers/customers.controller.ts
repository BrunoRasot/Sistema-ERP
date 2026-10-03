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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomerDto } from './dto/filter-customer.dto';
import { RegisterBottleTransactionDto } from './dto/register-bottle-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Customers & Bottles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.VENDEDOR, Role.CAJERO, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Registrar un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado con éxito' })
  @ApiResponse({ status: 409, description: 'Documento ya registrado' })
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.create(createCustomerDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes con paginación server-side y filtros' })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes' })
  findAll(@Query() filterDto: FilterCustomerDto) {
    return this.customersService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un cliente con métricas de compra y deuda' })
  @ApiResponse({ status: 200, description: 'Detalle de cliente' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.VENDEDOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar datos de un cliente' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.update(id, updateCustomerDto, userId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar de baja (soft delete) a un cliente sin deudas ni bidones pendientes' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.customersService.remove(id, userId);
  }

  // OPERACIONES DE BIDONES RETORNABLES

  @Post(':id/bottles')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.VENDEDOR, Role.REPARTIDOR, Role.ALMACENERO)
  @ApiOperation({
    summary: 'Registrar movimiento de bidones (Entrega, Devolución de vacíos, Pérdida o Dañado)',
  })
  @ApiResponse({ status: 200, description: 'Movimiento de envases registrado atómicamente' })
  registerBottleTransaction(
    @Param('id') customerId: string,
    @Body() dto: RegisterBottleTransactionDto,
    @CurrentUser('id') recordedById: string,
  ) {
    return this.customersService.registerBottleTransaction(customerId, dto, recordedById);
  }

  @Get(':id/bottles')
  @ApiOperation({ summary: 'Obtener el historial (Kardex) de envases retornables del cliente' })
  getBottleHistory(@Param('id') customerId: string) {
    return this.customersService.getBottleHistory(customerId);
  }
}
