import { IsString, IsOptional } from 'class-validator';

export class UpdateBottleConditionDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
