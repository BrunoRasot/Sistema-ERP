import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { InventoryMovementType } from '@prisma/client';

export class RegisterMovementDto {
  @ApiProperty({ example: 'uuid-producto', description: 'ID del producto' })
  @IsString()
  @IsNotEmpty({ message: 'El producto es requerido' })
  productId: string;

  @ApiProperty({
    enum: InventoryMovementType,
    example: InventoryMovementType.ENTRADA,
    description: 'Tipo de movimiento en Kardex',
  })
  @IsEnum(InventoryMovementType, { message: 'Tipo de movimiento inválido' })
  movementType: InventoryMovementType;

  @ApiProperty({
    example: 50,
    description:
      'Cantidad a mover. Para AJUSTE, representa el nuevo stock final real verificado en conteo físico.',
  })
  @IsInt({ message: 'La cantidad debe ser un entero' })
  @Min(0, { message: 'La cantidad debe ser mayor o igual a 0' })
  quantity: number;

  @ApiPropertyOptional({ example: 4.5, description: 'Costo unitario del movimiento' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiProperty({
    example: 'Ingreso de producción Lote-0929',
    description: 'Justificación clara del movimiento de almacén',
  })
  @IsString()
  @IsNotEmpty({ message: 'El motivo del movimiento es obligatorio para auditoría' })
  reason: string;

  @ApiPropertyOptional({ example: 'MANUAL', description: 'Tipo de documento o referencia externa' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'ID del documento de referencia si aplica' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
