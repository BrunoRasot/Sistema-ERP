import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty({ description: 'ID del usuario repartidor a asignar' })
  @IsUUID()
  driverId: string;
}
