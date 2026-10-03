import { IsNumber, IsOptional } from 'class-validator';

export class CreateBottleStockDto {
  @IsNumber()
  @IsOptional()
  productId?: number;

  @IsNumber()
  @IsOptional()
  zoneId?: number;

  @IsNumber()
  @IsOptional()
  totalEmpty?: number;

  @IsNumber()
  @IsOptional()
  totalFull?: number;

  @IsNumber()
  @IsOptional()
  threshold?: number;
}
