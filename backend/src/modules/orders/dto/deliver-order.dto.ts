import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod, SaleType } from '@prisma/client';

export class DeliverOrderDto {
  @ApiPropertyOptional({ description: 'Cantidad de bidones entregados al cliente', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bottlesDelivered?: number;

  @ApiPropertyOptional({ description: 'Cantidad de bidones vacíos recogidos del cliente', example: 5, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bottlesReturned?: number = 0;

  @ApiPropertyOptional({ enum: SaleType, default: SaleType.CONTADO })
  @IsOptional()
  @IsEnum(SaleType)
  saleType?: SaleType = SaleType.CONTADO;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.EFECTIVO })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.EFECTIVO;

  @ApiPropertyOptional({ description: 'Código de operación bancaria o Yape/Plin' })
  @IsOptional()
  @IsString()
  operationCode?: string;

  @ApiPropertyOptional({ description: 'Monto cobrado en la entrega (opcional si es al contado completo)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Notas de la entrega o incidencias' })
  @IsOptional()
  @IsString()
  notes?: string;
}
