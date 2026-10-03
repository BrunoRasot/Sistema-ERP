import { apiClient } from '@/lib/api/client';
import {
  InventoryMovement,
  KardexListResponse,
  InventorySummary,
  RegisterMovementInput,
} from '../types/inventory';

export const inventoryService = {
  async getSummary(): Promise<InventorySummary> {
    return apiClient<InventorySummary>('/inventory/summary');
  },

  async getKardex(params: {
    page?: number;
    limit?: number;
    productId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<KardexListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.productId) query.append('productId', params.productId);
    if (params.movementType) query.append('movementType', params.movementType);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    return apiClient<KardexListResponse>(`/inventory/movements?${query.toString()}`);
  },

  async registerMovement(
    input: RegisterMovementInput,
  ): Promise<{ movement: InventoryMovement; previousStock: number; newStock: number; message: string }> {
    return apiClient('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
