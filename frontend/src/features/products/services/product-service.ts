import { apiClient } from '@/lib/api/client';
import { Product, ProductListResponse, Category, CreateProductInput } from '../types/product';

export const productService = {
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isReturnable?: boolean;
    isLowStock?: boolean;
    status?: 'ACTIVE' | 'INACTIVE';
  } = {}): Promise<ProductListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.isReturnable !== undefined) query.append('isReturnable', params.isReturnable.toString());
    if (params.isLowStock !== undefined) query.append('isLowStock', params.isLowStock.toString());
    if (params.status) query.append('status', params.status);

    return apiClient<ProductListResponse>(`/products?${query.toString()}`);
  },

  async getProductById(id: string): Promise<Product> {
    return apiClient<Product>(`/products/${id}`);
  },

  async getCategories(): Promise<Category[]> {
    return apiClient<Category[]>('/products/categories');
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    return apiClient<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product> {
    return apiClient<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    return apiClient(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};
