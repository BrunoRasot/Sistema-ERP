import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { DocumentType, CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ enum: DocumentType, default: DocumentType.DNI })
  @IsEnum(DocumentType, { message: 'Tipo de documento no válido' })
  documentType: DocumentType;

  @ApiProperty({ example: '72345678', description: 'Número de DNI (8 dígitos) o RUC (11 dígitos)' })
  @IsString()
  @IsNotEmpty({ message: 'El número de documento es requerido' })
  documentNumber: string;

  @ApiProperty({ example: 'Juan Pérez Rodríguez', description: 'Nombre completo o persona de contacto' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiPropertyOptional({ example: 'Distribuidora Pérez E.I.R.L.', description: 'Razón social si es empresa' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ example: '987654321', description: 'Teléfono celular principal' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  phone: string;

  @ApiPropertyOptional({ example: '987654321', description: 'Número de WhatsApp para envío de comprobantes' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'juan@gmail.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'Av. Las Palmeras 123 Dpto 401', description: 'Dirección de entrega' })
  @IsString()
  @IsNotEmpty({ message: 'La dirección es requerida' })
  address: string;

  @ApiPropertyOptional({ example: 'Frente al parque principal, portón negro' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: -12.0864 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -77.0345 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ enum: CustomerType, default: CustomerType.HOGAR })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiPropertyOptional({ example: 0, description: 'Límite de crédito asignado en soles' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ example: 'Zona 1', description: 'Zona de reparto' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ example: 'Los Olivos', description: 'Distrito' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'HOGAR', description: 'Sub canal de venta' })
  @IsOptional()
  @IsString()
  subchannel?: string;

  @ApiPropertyOptional({ example: 'Dejar pedido en conserjería si no responden' })
  @IsOptional()
  @IsString()
  notes?: string;
}
