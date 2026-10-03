import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateSubChannelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  districtId?: number;
}
