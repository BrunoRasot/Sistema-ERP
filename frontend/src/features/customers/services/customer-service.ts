import { apiClient } from '@/lib/api/client';
import {
  Customer,
  CustomerListResponse,
  CreateCustomerInput,
  RegisterBottleInput,
  BottleTransaction,
} from '../types/customer';

export const customerService = {
  async getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerType?: string;
    withBottlesPending?: boolean;
  } = {}): Promise<CustomerListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.customerType) query.append('customerType', params.customerType);
    if (params.withBottlesPending) query.append('withBottlesPending', 'true');

    return apiClient<CustomerListResponse>(`/customers?${query.toString()}`);
  },

  async getCustomerById(id: string): Promise<Customer & { metrics: any }> {
    return apiClient<Customer & { metrics: any }>(`/customers/${id}`);
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return apiClient<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async registerBottleMovement(
    customerId: string,
    input: RegisterBottleInput,
  ): Promise<{ transaction: BottleTransaction; customerBottlesHolding: number; message: string }> {
    return apiClient(`/customers/${customerId}/bottles`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getCustomerBottleHistory(
    customerId: string,
  ): Promise<{ customer: { id: string; name: string; bottlesHolding: number }; history: BottleTransaction[] }> {
    return apiClient(`/customers/${customerId}/bottles`);
  },
};
