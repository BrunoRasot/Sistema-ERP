import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType, LoyaltyTier } from '@prisma/client';

export class FilterCustomerDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Búsqueda por DNI, RUC, Nombre, Teléfono o WhatsApp' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CustomerType })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiPropertyOptional({ enum: LoyaltyTier })
  @IsOptional()
  @IsEnum(LoyaltyTier)
  loyaltyTier?: LoyaltyTier;

  @ApiPropertyOptional({ description: 'Filtrar solo clientes con envases pendientes de retorno' })
  @IsOptional()
  @Type(() => Boolean)
  withBottlesPending?: boolean;

  @ApiPropertyOptional({ description: 'Categoría de compra (TOP_BUYER, FREQUENT, OCCASIONAL, NO_PURCHASES)' })
  @IsOptional()
  @IsString()
  purchaseCategory?: 'TOP_BUYER' | 'FREQUENT' | 'OCCASIONAL' | 'NO_PURCHASES';

  @ApiPropertyOptional({ description: 'Criterio de ordenamiento' })
  @IsOptional()
  @IsString()
  sortBy?: 'MOST_PURCHASES' | 'LEAST_PURCHASES' | 'RECENT' | 'NAME' | 'DEBT' | 'BOTTLES';
}
