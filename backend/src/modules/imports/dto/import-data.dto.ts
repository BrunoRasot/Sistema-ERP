import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class ImportFileDto {
  @ApiPropertyOptional({ description: 'Archivo Excel (.xlsx, .xls) o CSV codificado en Base64' })
  @IsOptional()
  @IsString()
  fileBase64?: string;

  @ApiPropertyOptional({ description: 'Nombre del archivo original', example: 'clientes_historicos.xlsx' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'Filas procesadas directamente en JSON (opcional)' })
  @IsOptional()
  @IsArray()
  rows?: any[];
}
