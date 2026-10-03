export type InvoiceType = 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
export type SunatStatus = 'PENDIENTE' | 'PROCESANDO' | 'ACEPTADO' | 'RECHAZADO' | 'ANULADO';

export interface ElectronicDocument {
  id: string;
  saleId: string;
  invoiceType: InvoiceType;
  series: string;
  correlative: number;
  issueDate: string;
  hash?: string | null;
  xmlUrl?: string | null;
  pdfUrl?: string | null;
  cdrUrl?: string | null;
  sunatStatus: SunatStatus;
  sunatResponseCode?: string | null;
  sunatResponseMessage?: string | null;
  isVoided: boolean;
  voidReason?: string | null;
  customerChannel: string;
  notificationStatus: string;
  createdAt: string;
  sale?: {
    id: string;
    saleNumber: string;
    total: number;
    subtotal: number;
    tax: number;
    customer?: {
      id: string;
      name: string;
      documentType: string;
      documentNumber: string;
      phone?: string;
    };
    items?: Array<{
      product: { name: string };
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
}

export interface TicketData {
  company: {
    ruc: string;
    razonSocial: string;
    nombreComercial: string;
    address: string;
    district: string;
    province: string;
    department: string;
    ubigeo: string;
  };
  documentNumber: string;
  documentTypeLabel: string;
  issueDate: string;
  customer: {
    name: string;
    documentType: string;
    documentNumber: string;
    address: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  financials: {
    subtotal: number;
    tax: number;
    total: number;
    wordsTotal: string;
  };
  sunat: {
    hash?: string | null;
    status: SunatStatus;
    responseMessage?: string | null;
    qrText: string;
  };
}

export interface EmitInvoiceInput {
  saleId: string;
  invoiceType: InvoiceType;
  series?: string;
  customerChannel?: string;
}

export interface BillingListResponse {
  data: ElectronicDocument[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
