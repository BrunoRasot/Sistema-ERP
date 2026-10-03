import { apiClient } from '@/lib/api/client';
import {
  ReceivablesResponse,
  CollectPaymentInput,
  CollectPaymentResult,
  PaymentHistoryItem,
} from '../types/payment';

export const paymentService = {
  async getReceivables(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    paymentStatus?: string;
    isOverdue?: boolean;
  } = {}): Promise<ReceivablesResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.customerId) query.append('customerId', params.customerId);
    if (params.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    if (params.isOverdue !== undefined) query.append('isOverdue', params.isOverdue.toString());

    return apiClient<ReceivablesResponse>(`/payments/receivables?${query.toString()}`);
  },

  async collectPayment(input: CollectPaymentInput): Promise<CollectPaymentResult> {
    return apiClient<CollectPaymentResult>('/payments/collect', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getHistory(limit: number = 50): Promise<PaymentHistoryItem[]> {
    return apiClient<PaymentHistoryItem[]>(`/payments/history?limit=${limit}`);
  },
};
