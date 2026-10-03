import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UnitOfMeasure, EntityStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'AGUA-REC-20L', description: 'Código único de SKU o barras' })
  @IsString()
  @IsNotEmpty({ message: 'El código del producto es requerido' })
  code: string;

  @ApiProperty({ example: 'Recarga Bidón 20 Litros', description: 'Nombre comercial del producto' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es requerido' })
  name: string;

  @ApiPropertyOptional({ example: 'Recarga de agua purificada dejando envase vacío' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-categoria', description: 'ID de la categoría' })
  @IsString()
  @IsNotEmpty({ message: 'La categoría es requerida' })
  categoryId: string;

  @ApiProperty({ example: 15.0, description: 'Precio de venta al público en soles' })
  @IsNumber()
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  price: number;

  @ApiProperty({ example: 4.5, description: 'Costo de adquisición o producción en soles' })
  @IsNumber()
  @Min(0, { message: 'El costo debe ser mayor o igual a 0' })
  cost: number;

  @ApiPropertyOptional({ enum: UnitOfMeasure, default: UnitOfMeasure.UNIDAD })
  @IsOptional()
  @IsEnum(UnitOfMeasure, { message: 'Unidad de medida inválida' })
  unit?: UnitOfMeasure;

  @ApiPropertyOptional({ example: 100, default: 0, description: 'Stock físico inicial en almacén' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 20, default: 10, description: 'Umbral mínimo de stock para alerta' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Indica si este producto involucra un envase retornable (bidón)',
  })
  @IsOptional()
  @IsBoolean()
  isReturnable?: boolean;

  @ApiPropertyOptional({ example: 'https://...', description: 'URL de la imagen del producto' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: EntityStatus, default: EntityStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
