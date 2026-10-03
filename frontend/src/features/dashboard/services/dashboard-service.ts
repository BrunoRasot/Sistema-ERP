import { apiClient } from '@/lib/api/client';
import { DashboardStats } from '../types/dashboard';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    return apiClient<DashboardStats>('/dashboard/stats');
  },
};
