import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBottleConditionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;
}
