import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { InvoiceType, NotificationChannel } from '@prisma/client';

export class EmitInvoiceDto {
  @ApiProperty({ description: 'ID de la venta a facturar' })
  @IsUUID()
  saleId: string;

  @ApiProperty({ enum: InvoiceType, description: 'Tipo: BOLETA o FACTURA', default: InvoiceType.BOLETA })
  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @ApiPropertyOptional({ description: 'Serie personalizada (ej: B001 o F001)', example: 'B001' })
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Canal de envío al cliente' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  customerChannel?: NotificationChannel = NotificationChannel.WHATSAPP;
}
