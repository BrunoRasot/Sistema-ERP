import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDistrictDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  zoneId: number;
}
