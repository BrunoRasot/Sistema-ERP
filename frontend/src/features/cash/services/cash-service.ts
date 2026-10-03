import { apiClient } from '@/lib/api/client';
import { CashRegister, CashShift, OpenShiftInput, CloseShiftInput } from '../types/cash';

export const cashService = {
  async getRegisters(): Promise<CashRegister[]> {
    return apiClient<CashRegister[]>('/cash/registers');
  },

  async getActiveShift(): Promise<CashShift | null> {
    return apiClient<CashShift | null>('/cash/shifts/active');
  },

  async openShift(input: OpenShiftInput): Promise<CashShift> {
    return apiClient<CashShift>('/cash/shifts/open', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async closeShift(shiftId: string, input: CloseShiftInput): Promise<{ shift: CashShift; difference: number; message: string }> {
    return apiClient(`/cash/shifts/${shiftId}/close`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
