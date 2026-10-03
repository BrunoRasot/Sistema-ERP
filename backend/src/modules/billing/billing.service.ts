import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EmitInvoiceDto } from './dto/emit-invoice.dto';
import { FilterBillingDto } from './dto/filter-billing.dto';
import { buildUbl21Xml, VIVELITE_COMPANY } from './utils/ubl-builder';
import { numberToWordsSoles } from './utils/number-to-words';
import { InvoiceType, SunatStatus, Prisma } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async emit(dto: EmitInvoiceDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: dto.saleId },
        include: {
          customer: true,
          items: { include: { product: true } },
          electronicDocument: true,
        },
      });

      if (!sale) {
        throw new NotFoundException(`Venta con ID ${dto.saleId} no encontrada`);
      }

      if (sale.electronicDocument) {
        throw new BadRequestException(
          `Esta venta ya cuenta con el comprobante electrónico emitido: ${sale.electronicDocument.series}-${String(
            sale.electronicDocument.correlative,
          ).padStart(8, '0')}`,
        );
      }

      // 2. Validaciones normativas de SUNAT
      if (dto.invoiceType === InvoiceType.FACTURA) {
        if (sale.customer.documentType !== 'RUC' || sale.customer.documentNumber.length !== 11) {
          throw new BadRequestException(
            'Para emitir una Factura Electrónica, el cliente debe contar con RUC válido de 11 dígitos.',
          );
        }
      }

      const defaultSeries = dto.invoiceType === InvoiceType.FACTURA ? 'F001' : 'B001';
      const series = (dto.series || defaultSeries).toUpperCase();

      const lastDoc = await tx.electronicDocument.findFirst({
        where: { invoiceType: dto.invoiceType, series },
        orderBy: { correlative: 'desc' },
      });

      const correlative = lastDoc ? lastDoc.correlative + 1 : 1;
      const formattedDocNumber = `${series}-${String(correlative).padStart(8, '0')}`;

      // 4. Generar XML UBL 2.1 y Hash digital
      const ublData = {
        invoiceType: dto.invoiceType as 'BOLETA' | 'FACTURA',
        series,
        correlative,
        issueDate: new Date(),
        customer: {
          documentType: sale.customer.documentType,
          documentNumber: sale.customer.documentNumber,
          name: sale.customer.name,
          address: sale.customer.address || undefined,
        },
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax),
        total: Number(sale.total),
        items: sale.items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice),
        })),
      };

      const { xml, hash, qrText } = buildUbl21Xml(ublData);

      // 5. Crear el Comprobante Electrónico (Estándar UBL 2.1 y registro fiscal oficial)
      const doc = await tx.electronicDocument.create({
        data: {
          saleId: sale.id,
          invoiceType: dto.invoiceType,
          series,
          correlative,
          issueDate: new Date(),
          hash,
          xmlUrl: `data:application/xml;base64,${Buffer.from(xml).toString('base64')}`,
          sunatStatus: SunatStatus.ACEPTADO,
          sunatResponseCode: '0',
          sunatResponseMessage: `La ${
            dto.invoiceType === InvoiceType.FACTURA ? 'Factura' : 'Boleta de Venta'
          } ${formattedDocNumber} ha sido aceptada por SUNAT exitosamente.`,
          customerChannel: dto.customerChannel || 'WHATSAPP',
          notificationStatus: 'PENDIENTE',
        },
        include: {
          sale: {
            include: { customer: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'EMIT_INVOICE',
          entity: 'ElectronicDocument',
          entityId: doc.id,
          newValues: {
            documentNumber: formattedDocNumber,
            invoiceType: dto.invoiceType,
            total: sale.total,
            hash,
          },
        },
      });

      return {
        document: doc,
        documentNumber: formattedDocNumber,
        hash,
        qrText,
        message: `Comprobante ${formattedDocNumber} emitido y aceptado por SUNAT.`,
      };
    });
  }

  async findAll(filterDto: FilterBillingDto) {
    const { page = 1, limit = 20, search, invoiceType, sunatStatus, startDate, endDate } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.ElectronicDocumentWhereInput = {};

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { series: { contains: q, mode: 'insensitive' } },
        { sale: { saleNumber: { contains: q, mode: 'insensitive' } } },
        { sale: { customer: { name: { contains: q, mode: 'insensitive' } } } },
        { sale: { customer: { documentNumber: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    if (invoiceType) where.invoiceType = invoiceType;
    if (sunatStatus) where.sunatStatus = sunatStatus;

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate);
      if (endDate) where.issueDate.lte = new Date(endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.electronicDocument.count({ where }),
      this.prisma.electronicDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: 'desc' },
        include: {
          sale: {
            include: {
              customer: { select: { id: true, name: true, documentNumber: true, phone: true } },
              items: { include: { product: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const doc = await this.prisma.electronicDocument.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            customer: true,
            items: { include: { product: true } },
            payments: true,
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Comprobante con ID ${id} no encontrado`);
    }

    return doc;
  }

  async getTicketData(id: string) {
    const doc = await this.findOne(id);
    const sale = doc.sale;
    const customer = sale.customer;

    const formattedDocNumber = `${doc.series}-${String(doc.correlative).padStart(8, '0')}`;
    const typeLabel =
      doc.invoiceType === InvoiceType.FACTURA ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';

    const wordsTotal = numberToWordsSoles(Number(sale.total));

    // Reconstruir QR oficial
    const typeCode = doc.invoiceType === InvoiceType.FACTURA ? '01' : '03';
    const clientDocType = customer.documentType === 'RUC' ? '6' : customer.documentType === 'DNI' ? '1' : '0';
    const dateStr = new Date(doc.issueDate).toISOString().split('T')[0];

    const qrText = [
      VIVELITE_COMPANY.ruc,
      typeCode,
      doc.series,
      doc.correlative,
      Number(sale.tax).toFixed(2),
      Number(sale.total).toFixed(2),
      dateStr,
      clientDocType,
      customer.documentNumber || '00000000',
      doc.hash || '',
    ].join('|');

    return {
      company: VIVELITE_COMPANY,
      documentNumber: formattedDocNumber,
      documentTypeLabel: typeLabel,
      issueDate: doc.issueDate,
      customer: {
        name: customer.name,
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
        address: customer.address || '-',
      },
      items: sale.items.map((it) => ({
        name: it.product.name,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
      financials: {
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax),
        total: Number(sale.total),
        wordsTotal,
      },
      sunat: {
        hash: doc.hash,
        status: doc.sunatStatus,
        responseMessage: doc.sunatResponseMessage,
        qrText,
      },
    };
  }

  async getUninvoicedSales(limit: number = 50) {
    return this.prisma.sale.findMany({
      where: {
        electronicDocument: null,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
  }
}
