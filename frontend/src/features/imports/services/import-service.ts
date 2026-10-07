import { apiClient } from '@/lib/api/client';
import { ImportResult } from '../types/import';

export const importService = {
  async downloadTemplate(type: 'customers' | 'products'): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vivelite_access_token') : '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${baseUrl}/imports/templates/${type}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Error al descargar la plantilla');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_arca_${type}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async importCustomers(fileBase64: string, fileName: string): Promise<ImportResult> {
    return apiClient<ImportResult>('/imports/customers', {
      method: 'POST',
      body: JSON.stringify({ fileBase64, fileName }),
    });
  },

  async importProducts(fileBase64: string, fileName: string): Promise<ImportResult> {
    return apiClient<ImportResult>('/imports/products', {
      method: 'POST',
      body: JSON.stringify({ fileBase64, fileName }),
    });
  },
};
