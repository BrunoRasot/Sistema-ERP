import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSubChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  districtId: number;
}
