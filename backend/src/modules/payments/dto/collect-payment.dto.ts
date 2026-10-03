import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CollectPaymentDto {
  @ApiProperty({ description: 'ID de la venta con saldo pendiente' })
  @IsUUID()
  saleId: string;

  @ApiProperty({ description: 'Monto a amortizar / cobrar', example: 50.0 })
  @IsNumber()
  @Min(0.1)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Medio de cobro', default: PaymentMethod.EFECTIVO })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Código de operación bancaria o billetera digital' })
  @IsOptional()
  @IsString()
  operationCode?: string;

  @ApiPropertyOptional({ description: 'Observaciones o notas del cobro' })
  @IsOptional()
  @IsString()
  notes?: string;
}
