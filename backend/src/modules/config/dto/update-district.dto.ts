import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateDistrictDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  zoneId?: number;
}
