export type UnitOfMeasure = 'UNIDAD' | 'BIDON_20L' | 'BIDON_10L' | 'CAJA' | 'PAQUETE' | 'LITRO';
export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  status: EntityStatus;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  price: string | number;
  cost: string | number;
  unit: UnitOfMeasure;
  stock: number;
  minStock: number;
  isReturnable: boolean;
  imageUrl?: string | null;
  status: EntityStatus;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateProductInput {
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  cost: number;
  unit: UnitOfMeasure;
  stock?: number;
  minStock?: number;
  isReturnable?: boolean;
  imageUrl?: string;
}
