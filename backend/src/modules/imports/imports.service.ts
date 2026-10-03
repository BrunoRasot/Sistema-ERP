import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ImportFileDto } from './dto/import-data.dto';
import {
  DocumentType,
  CustomerType,
  UnitOfMeasure,
  InventoryMovementType,
  BottleTransactionType,
} from '@prisma/client';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  generateTemplate(type: 'customers' | 'products'): Buffer {
    const wb = XLSX.utils.book_new();

    if (type === 'customers') {
      const sampleCustomers = [
        {
          Tipo_Documento: 'DNI',
          Numero_Documento: '45678912',
          Nombre_RazonSocial: 'Juan Pérez Silva',
          Telefono: '987654321',
          Direccion: 'Av. Las Palmeras 123',
          Referencia: 'Frente al parque',
          Tipo_Cliente: 'HOGAR',
          Bidones_En_Poder: 3,
          Deuda_Inicial: 0,
          Limite_Credito: 100,
        },
        {
          Tipo_Documento: 'RUC',
          Numero_Documento: '20601234567',
          Nombre_RazonSocial: 'Restaurante El Buen Sabor S.A.C.',
          Telefono: '912345678',
          Direccion: 'Jr. Los Álamos 450',
          Referencia: 'Esq. con Av. Principal',
          Tipo_Cliente: 'EMPRESA',
          Bidones_En_Poder: 10,
          Deuda_Inicial: 150.0,
          Limite_Credito: 500,
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleCustomers);
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    } else {
      const sampleProducts = [
        {
          Codigo: 'AGUA-20L-RECARGA',
          Nombre: 'Recarga de Agua 20L Purificada',
          Categoria: 'Agua de Mesa',
          Precio_Venta: 15.0,
          Costo: 5.5,
          Unidad: 'BIDON_20L',
          Stock_Inicial: 100,
          Es_Retornable: 'SI',
        },
        {
          Codigo: 'DISPENSADOR-MANUAL',
          Nombre: 'Dispensador de Bomba Manual para Bidón',
          Categoria: 'Accesorios',
          Precio_Venta: 25.0,
          Costo: 12.0,
          Unidad: 'UNIDAD',
          Stock_Inicial: 30,
          Es_Retornable: 'NO',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleProducts);
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  private extractRows(dto: ImportFileDto): any[] {
    if (dto.rows && Array.isArray(dto.rows) && dto.rows.length > 0) {
      return dto.rows;
    }

    if (dto.fileBase64) {
      try {
        const cleanBase64 = dto.fileBase64.replace(/^data:.*?;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(sheet, { defval: '' });
      } catch (err: any) {
        throw new BadRequestException(`No se pudo leer el archivo Excel/CSV: ${err.message}`);
      }
    }

    throw new BadRequestException('Debe proporcionar un archivo Excel/CSV en base64 o las filas en JSON');
  }

  async importCustomers(dto: ImportFileDto, userId?: string) {
    const rawRows = this.extractRows(dto);
    if (rawRows.length === 0) {
      throw new BadRequestException('El archivo no contiene filas para importar');
    }

    let successCount = 0;
    const errors: Array<{ row: number; identifier: string; error: string }> = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = i + 2;

      const docNumber = String(
        row.Numero_Documento || row.documentNumber || row.DNI || row.RUC || '',
      ).trim();
      const name = String(row.Nombre_RazonSocial || row.name || row.Nombre || '').trim();

      if (!docNumber) {
        errors.push({ row: rowNumber, identifier: 'N/A', error: 'Número de documento es obligatorio' });
        continue;
      }
      if (!name) {
        errors.push({ row: rowNumber, identifier: docNumber, error: 'Nombre o Razón Social es obligatorio' });
        continue;
      }

      // Validar tipo de documento
      let docType: DocumentType = DocumentType.DNI;
      const rawDocType = String(row.Tipo_Documento || row.documentType || '').toUpperCase();
      if (rawDocType.includes('RUC') || docNumber.length === 11) {
        docType = DocumentType.RUC;
      } else if (rawDocType.includes('CE')) {
        docType = DocumentType.CE;
      } else if (rawDocType.includes('PAS')) {
        docType = DocumentType.PASAPORTE;
      }

      // Validar tipo de cliente
      let custType: CustomerType = docType === DocumentType.RUC ? CustomerType.EMPRESA : CustomerType.HOGAR;
      const rawCustType = String(row.Tipo_Cliente || row.customerType || '').toUpperCase();
      if (rawCustType.includes('EMPRESA')) custType = CustomerType.EMPRESA;
      else if (rawCustType.includes('DIST')) custType = CustomerType.DISTRIBUIDOR;
      else if (rawCustType.includes('HOGAR')) custType = CustomerType.HOGAR;

      const phone = String(row.Telefono || row.phone || row.Celular || '').trim() || '999999999';
      const address = String(row.Direccion || row.address || '').trim() || 'Dirección registrada';
      const reference = String(row.Referencia || row.reference || '').trim() || null;
      const bottlesHolding = Math.max(0, parseInt(row.Bidones_En_Poder || row.bottlesHolding || '0', 10) || 0);
      const currentDebt = Math.max(0, parseFloat(row.Deuda_Inicial || row.currentDebt || '0') || 0);
      const creditLimit = Math.max(0, parseFloat(row.Limite_Credito || row.creditLimit || '0') || 0);

      try {
        await this.prisma.$transaction(async (tx) => {
          const existing = await tx.customer.findFirst({
            where: { documentNumber: docNumber },
          });

          let customerId = '';
          if (existing) {
            const updated = await tx.customer.update({
              where: { id: existing.id },
              data: {
                name,
                phone,
                address,
                reference,
                bottlesHolding,
                currentDebt,
                creditLimit,
              },
            });
            customerId = updated.id;
          } else {
            const created = await tx.customer.create({
              data: {
                documentType: docType,
                documentNumber: docNumber,
                name,
                phone,
                address,
                reference,
                customerType: custType,
                bottlesHolding,
                currentDebt,
                creditLimit,
              },
            });
            customerId = created.id;
          }

          // Registrar en Kardex de Bidones si tiene saldo inicial en custodia
          if (bottlesHolding > 0) {
            await tx.bottleTransaction.create({
              data: {
                customerId,
                type: BottleTransactionType.AJUSTE,
                quantity: bottlesHolding,
                balanceAfter: bottlesHolding,
                notes: 'Saldo inicial de bidones migrado desde Excel',
                recordedById: userId,
              },
            });
          }
        });

        successCount++;
      } catch (err: any) {
        errors.push({ row: rowNumber, identifier: docNumber, error: err.message || 'Error al guardar' });
      }
    }

    return {
      totalRows: rawRows.length,
      successCount,
      errorCount: errors.length,
      errors,
      message: `Migración finalizada: ${successCount} clientes importados con éxito, ${errors.length} errores.`,
    };
  }

  async importProducts(dto: ImportFileDto, userId?: string) {
    const rawRows = this.extractRows(dto);
    if (rawRows.length === 0) {
      throw new BadRequestException('El archivo no contiene filas para importar');
    }

    let successCount = 0;
    const errors: Array<{ row: number; identifier: string; error: string }> = [];

    // Categoría por defecto si no existe
    let defaultCategory = await this.prisma.category.findFirst({
      where: { name: 'General' },
    });
    if (!defaultCategory) {
      defaultCategory = await this.prisma.category.create({
        data: { name: 'General', description: 'Categoría General' },
      });
    }

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = i + 2;

      const code = String(row.Codigo || row.code || '').trim().toUpperCase();
      const name = String(row.Nombre || row.name || '').trim();

      if (!code) {
        errors.push({ row: rowNumber, identifier: 'N/A', error: 'Código de producto es obligatorio' });
        continue;
      }
      if (!name) {
        errors.push({ row: rowNumber, identifier: code, error: 'Nombre de producto es obligatorio' });
        continue;
      }

      const categoryName = String(row.Categoria || row.category || '').trim();
      let categoryId = defaultCategory.id;
      if (categoryName) {
        let cat = await this.prisma.category.findFirst({ where: { name: categoryName } });
        if (!cat) {
          cat = await this.prisma.category.create({ data: { name: categoryName } });
        }
        categoryId = cat.id;
      }

      const price = Math.max(0, parseFloat(row.Precio_Venta || row.price || '0') || 0);
      const cost = Math.max(0, parseFloat(row.Costo || row.cost || '0') || 0);
      const stock = Math.max(0, parseInt(row.Stock_Inicial || row.stock || '0', 10) || 0);

      const rawReturnable = String(row.Es_Retornable || row.isReturnable || '').toUpperCase();
      const isReturnable =
        rawReturnable === 'SI' || rawReturnable === 'TRUE' || rawReturnable === '1';

      let unit: UnitOfMeasure = isReturnable ? UnitOfMeasure.BIDON_20L : UnitOfMeasure.UNIDAD;
      const rawUnit = String(row.Unidad || row.unit || '').toUpperCase();
      if (rawUnit.includes('BIDON_20L') || rawUnit.includes('20L')) unit = UnitOfMeasure.BIDON_20L;
      else if (rawUnit.includes('BIDON_10L') || rawUnit.includes('10L')) unit = UnitOfMeasure.BIDON_10L;
      else if (rawUnit.includes('CAJA')) unit = UnitOfMeasure.CAJA;
      else if (rawUnit.includes('PAQUETE')) unit = UnitOfMeasure.PAQUETE;
      else if (rawUnit.includes('LITRO')) unit = UnitOfMeasure.LITRO;

      try {
        await this.prisma.$transaction(async (tx) => {
          const existing = await tx.product.findFirst({ where: { code } });

          let productId = '';
          if (existing) {
            const updated = await tx.product.update({
              where: { id: existing.id },
              data: {
                name,
                categoryId,
                price,
                cost,
                unit,
                stock,
                isReturnable,
              },
            });
            productId = updated.id;
          } else {
            const created = await tx.product.create({
              data: {
                code,
                name,
                categoryId,
                price,
                cost,
                unit,
                stock,
                isReturnable,
              },
            });
            productId = created.id;
          }

          // Registrar en Kardex si tiene stock inicial
          if (stock > 0) {
            await tx.inventoryMovement.create({
              data: {
                productId,
                movementType: InventoryMovementType.AJUSTE,
                quantity: stock,
                previousStock: 0,
                newStock: stock,
                unitCost: cost,
                reason: 'Stock inicial cargado desde migración Excel',
                referenceType: 'EXCEL_MIGRATION',
                userId,
              },
            });
          }
        });

        successCount++;
      } catch (err: any) {
        errors.push({ row: rowNumber, identifier: code, error: err.message || 'Error al guardar' });
      }
    }

    return {
      totalRows: rawRows.length,
      successCount,
      errorCount: errors.length,
      errors,
      message: `Migración de catálogo finalizada: ${successCount} productos procesados con éxito, ${errors.length} errores.`,
    };
  }
}
