import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaleType, PaymentMethod } from '@prisma/client';

export class CreateSaleItemDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  @IsNotEmpty({ message: 'El producto es requerido' })
  productId: string;

  @ApiProperty({ example: 2, description: 'Cantidad vendida' })
  @IsInt({ message: 'La cantidad debe ser entera' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Precio unitario aplicado (si difiere del catálogo)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Descuento aplicado al ítem en soles' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 30.0, description: 'Monto pagado en esta transacción' })
  @IsNumber()
  @Min(0.1, { message: 'El monto de pago debe ser mayor a 0' })
  amount: number;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.EFECTIVO })
  @IsEnum(PaymentMethod, { message: 'Método de pago inválido' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'OP-459203', description: 'Código de operación Yape, Plin o Transferencia' })
  @IsOptional()
  @IsString()
  operationCode?: string;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ description: 'ID del cliente (si no se envía, se asigna cliente Mostrador)' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ enum: SaleType, default: SaleType.CONTADO })
  @IsOptional()
  @IsEnum(SaleType)
  saleType?: SaleType;

  @ApiProperty({ type: [CreateSaleItemDto], description: 'Listado de productos vendidos' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiPropertyOptional({ type: CreatePaymentDto, description: 'Pago inicial o total de la venta' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePaymentDto)
  payment?: CreatePaymentDto;

  @ApiPropertyOptional({
    example: 2,
    default: 0,
    description: 'Cantidad de bidones vacíos que el cliente devuelve en esta venta',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  bottlesReturned?: number;

  @ApiPropertyOptional({ example: '2026-10-15T00:00:00.000Z', description: 'Fecha de vencimiento si es venta a crédito' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Zona 1', description: 'Zona de reparto' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ example: 'Los Olivos', description: 'Distrito de entrega o cliente' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'DELIVERY', description: 'Subcanal (HOGAR, EMPRESA, DELIVERY, MOSTRADOR, WHATSAPP, BODEGA)' })
  @IsOptional()
  @IsString()
  subchannel?: string;

  @ApiPropertyOptional({ example: 'RECARGA', description: 'Condición del envase 20L (RECARGA, NUEVO_CON_ENVASE, PRESTAMO)' })
  @IsOptional()
  @IsString()
  bottleCondition20L?: string;

  @ApiPropertyOptional({ example: 'Venta presencial en mostrador' })
  @IsOptional()
  @IsString()
  notes?: string;
}

