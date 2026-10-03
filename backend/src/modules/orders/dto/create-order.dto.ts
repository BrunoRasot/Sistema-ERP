import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Cantidad solicitada', example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Precio unitario personalizado (opcional)', example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'ID del repartidor asignado (opcional)' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ description: 'Dirección exacta de entrega', example: 'Av. Las Palmeras 450, Los Olivos' })
  @IsString()
  deliveryAddress: string;

  @ApiPropertyOptional({ description: 'Referencia de entrega', example: 'Frente al parque zonal, rejas blancas' })
  @IsOptional()
  @IsString()
  deliveryReference?: string;

  @ApiPropertyOptional({ description: 'Latitud GPS para mapas' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitud GPS para mapas' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Fecha y turno programado de entrega', example: '2026-09-30T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Observaciones o notas especiales', example: 'Llamar antes de llegar' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Productos del pedido' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
