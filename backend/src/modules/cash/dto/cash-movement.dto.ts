import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CashMovementType, PaymentMethod } from '@prisma/client';

export class CreateCashMovementDto {
  @ApiProperty({ description: 'ID del turno de caja activo' })
  @IsString()
  @IsNotEmpty({ message: 'El turno de caja es requerido' })
  shiftId: string;

  @ApiProperty({ enum: CashMovementType, example: CashMovementType.EGRESO })
  @IsEnum(CashMovementType, { message: 'Tipo de movimiento inválido' })
  type: CashMovementType;

  @ApiProperty({ example: 35.0, description: 'Monto del movimiento en soles' })
  @IsNumber()
  @Min(0.1, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.EFECTIVO })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ example: 'Combustible para camión de reparto #1', description: 'Justificación del gasto o ingreso' })
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio para auditoría' })
  reason: string;
}
