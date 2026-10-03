import { apiClient } from '@/lib/api/client';
import {
  Order,
  OrderListResponse,
  CreateOrderInput,
  DeliverOrderInput,
  OrderStatus,
  Driver,
} from '../types/order';

export const orderService = {
  async getOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    driverId?: string;
    status?: OrderStatus;
  } = {}): Promise<OrderListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.customerId) query.append('customerId', params.customerId);
    if (params.driverId) query.append('driverId', params.driverId);
    if (params.status) query.append('status', params.status);

    return apiClient<OrderListResponse>(`/orders?${query.toString()}`);
  },

  async getOrderById(id: string): Promise<Order> {
    return apiClient<Order>(`/orders/${id}`);
  },

  async getDrivers(): Promise<Driver[]> {
    return apiClient<Driver[]>('/orders/drivers');
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    return apiClient<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    return apiClient<Order>(`/orders/${orderId}/assign-driver`, {
      method: 'PATCH',
      body: JSON.stringify({ driverId }),
    });
  },

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string,
  ): Promise<Order> {
    return apiClient<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async deliverOrder(
    orderId: string,
    input: DeliverOrderInput,
  ): Promise<{
    order: Order;
    sale: any;
    bottlesSummary: { delivered: number; returned: number; newHolding: number };
    message: string;
  }> {
    return apiClient(`/orders/${orderId}/deliver`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
