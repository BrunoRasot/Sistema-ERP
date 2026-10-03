import { apiClient } from '@/lib/api/client';
import {
  Zone,
  District,
  SubChannel,
  BottleCondition,
  BottleStock,
  BottleSummary,
  GlobalBottleTransaction,
} from '../types/config';

export const configService = {
  async getBottleSummary(): Promise<BottleSummary> {
    return apiClient<BottleSummary>('/config/bottles/summary');
  },

  async getBottleTransactions(params: {
    page?: number;
    limit?: number;
    customerId?: string;
    search?: string;
  } = {}): Promise<{ data: GlobalBottleTransaction[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.customerId) query.append('customerId', params.customerId);
    if (params.search) query.append('search', params.search);

    return apiClient(`/config/bottles/transactions?${query.toString()}`);
  },

  async seedDefaults(): Promise<void> {
    return apiClient('/config/seed', { method: 'POST' });
  },

  async getZones(): Promise<Zone[]> {
    return apiClient<Zone[]>('/config/zones');
  },

  async createZone(name: string): Promise<Zone> {
    return apiClient<Zone>('/config/zones', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async updateZone(id: number, name: string): Promise<Zone> {
    return apiClient<Zone>(`/config/zones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async deleteZone(id: number): Promise<void> {
    return apiClient(`/config/zones/${id}`, { method: 'DELETE' });
  },

  async getDistricts(zoneId?: number): Promise<District[]> {
    const query = zoneId ? `?zoneId=${zoneId}` : '';
    return apiClient<District[]>(`/config/districts${query}`);
  },

  async createDistrict(name: string, zoneId: number): Promise<District> {
    return apiClient<District>('/config/districts', {
      method: 'POST',
      body: JSON.stringify({ name, zoneId }),
    });
  },

  async updateDistrict(id: number, name?: string, zoneId?: number): Promise<District> {
    return apiClient<District>(`/config/districts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, zoneId }),
    });
  },

  async deleteDistrict(id: number): Promise<void> {
    return apiClient(`/config/districts/${id}`, { method: 'DELETE' });
  },

  async getSubChannels(districtId?: number): Promise<SubChannel[]> {
    const query = districtId ? `?districtId=${districtId}` : '';
    return apiClient<SubChannel[]>(`/config/subchannels${query}`);
  },

  async createSubChannel(name: string, districtId: number): Promise<SubChannel> {
    return apiClient<SubChannel>('/config/subchannels', {
      method: 'POST',
      body: JSON.stringify({ name, districtId }),
    });
  },

  async updateSubChannel(id: number, name?: string, districtId?: number): Promise<SubChannel> {
    return apiClient<SubChannel>(`/config/subchannels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, districtId }),
    });
  },

  async deleteSubChannel(id: number): Promise<void> {
    return apiClient(`/config/subchannels/${id}`, { method: 'DELETE' });
  },

  async getBottleConditions(): Promise<BottleCondition[]> {
    return apiClient<BottleCondition[]>('/config/bottle-conditions');
  },

  async createBottleCondition(code: string, description?: string): Promise<BottleCondition> {
    return apiClient<BottleCondition>('/config/bottle-conditions', {
      method: 'POST',
      body: JSON.stringify({ code, description }),
    });
  },

  async updateBottleCondition(id: number, code?: string, description?: string): Promise<BottleCondition> {
    return apiClient<BottleCondition>(`/config/bottle-conditions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ code, description }),
    });
  },

  async deleteBottleCondition(id: number): Promise<void> {
    return apiClient(`/config/bottle-conditions/${id}`, { method: 'DELETE' });
  },

  async getBottleStocks(): Promise<BottleStock[]> {
    return apiClient<BottleStock[]>('/config/bottle-stocks');
  },

  async updateBottleStock(id: number, data: Partial<BottleStock>): Promise<BottleStock> {
    return apiClient<BottleStock>(`/config/bottle-stocks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
