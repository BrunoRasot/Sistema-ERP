import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { BottleTransactionType } from '@prisma/client';

export class RegisterBottleTransactionDto {
  @ApiProperty({
    enum: BottleTransactionType,
    description: 'Tipo de operación con el envase',
    example: BottleTransactionType.DEVOLUCION,
  })
  @IsEnum(BottleTransactionType, { message: 'Tipo de movimiento de bidón no válido' })
  type: BottleTransactionType;

  @ApiProperty({ example: 2, description: 'Cantidad de bidones involucrados (mínimo 1)' })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity: number;

  @ApiPropertyOptional({ example: 'Cliente devolvió 2 bidones vacíos al chofer en ruta' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID del pedido relacionado si aplica' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'ID de la venta relacionada si aplica' })
  @IsOptional()
  @IsString()
  saleId?: string;
}
