import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenCashShiftDto {
  @ApiProperty({ description: 'ID de la caja física a abrir' })
  @IsString()
  @IsNotEmpty({ message: 'La caja es requerida' })
  cashRegisterId: string;

  @ApiProperty({ example: 100.0, description: 'Monto inicial en efectivo para vuelto/sencillo' })
  @IsNumber()
  @Min(0, { message: 'El saldo inicial no puede ser negativo' })
  initialBalance: number;

  @ApiPropertyOptional({ example: 'Turno mañana apertura con sencillo en monedas' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseCashShiftDto {
  @ApiProperty({ example: 650.0, description: 'Monto real de efectivo contado físicamente en caja' })
  @IsNumber()
  @Min(0, { message: 'El monto contado no puede ser negativo' })
  actualBalance: number;

  @ApiPropertyOptional({ example: 'Cierre sin novedades, billetes y monedas cuadradas' })
  @IsOptional()
  @IsString()
  notes?: string;
}
