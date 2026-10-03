import { apiClient } from '@/lib/api/client';
import {
  ElectronicDocument,
  BillingListResponse,
  TicketData,
  EmitInvoiceInput,
  InvoiceType,
  SunatStatus,
} from '../types/billing';

export const billingService = {
  async getDocuments(params: {
    page?: number;
    limit?: number;
    search?: string;
    invoiceType?: InvoiceType;
    sunatStatus?: SunatStatus;
  } = {}): Promise<BillingListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.invoiceType) query.append('invoiceType', params.invoiceType);
    if (params.sunatStatus) query.append('sunatStatus', params.sunatStatus);

    return apiClient<BillingListResponse>(`/billing?${query.toString()}`);
  },

  async getUninvoicedSales(limit: number = 50): Promise<any[]> {
    return apiClient<any[]>(`/billing/uninvoiced-sales?limit=${limit}`);
  },

  async emitInvoice(input: EmitInvoiceInput): Promise<{
    document: ElectronicDocument;
    documentNumber: string;
    hash: string;
    qrText: string;
    message: string;
  }> {
    return apiClient('/billing/emit', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getTicketData(documentId: string): Promise<TicketData> {
    return apiClient<TicketData>(`/billing/${documentId}/ticket`);
  },
};
