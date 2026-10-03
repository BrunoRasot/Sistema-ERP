import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
