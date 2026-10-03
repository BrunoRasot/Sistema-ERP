import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VoidInvoiceDto {
  @ApiProperty({
    description: 'Motivo normativo de anulación del comprobante electrónico',
    example: 'Error en digitación de RUC de cliente / Corrección de operación',
  })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio' })
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  reason: string;
}
