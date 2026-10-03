import { apiClient } from '@/lib/api/client';
import { Sale, SaleListResponse, CreateSaleInput } from '../types/sale';

export const saleService = {
  async getSales(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    paymentStatus?: string;
  } = {}): Promise<SaleListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.customerId) query.append('customerId', params.customerId);
    if (params.paymentStatus) query.append('paymentStatus', params.paymentStatus);

    return apiClient<SaleListResponse>(`/sales?${query.toString()}`);
  },

  async getSaleById(id: string): Promise<Sale> {
    return apiClient<Sale>(`/sales/${id}`);
  },

  async createSale(input: CreateSaleInput): Promise<{
    sale: Sale;
    bottlesSummary: { sold: number; returned: number; newHolding: number };
    message: string;
  }> {
    return apiClient('/sales', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async exportExcel(params: {
    search?: string;
    customerId?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vivelite_access_token') : '';
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.customerId) query.append('customerId', params.customerId);
    if (params.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${baseUrl}/sales/export/excel?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Error al exportar el registro de ventas');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registro_ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

