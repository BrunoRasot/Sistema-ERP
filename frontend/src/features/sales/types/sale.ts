import { PaymentMethod } from '@/features/cash/types/cash';

export type SaleType = 'CONTADO' | 'CREDITO';
export type PaymentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO' | 'ANULADO';

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  product?: {
    code: string;
    name: string;
    unit: string;
    isReturnable?: boolean;
  };
}

export interface Payment {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  operationCode?: string | null;
  paymentDate: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  saleType: SaleType;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  dueDate?: string | null;
  zone?: string | null;
  district?: string | null;
  subchannel?: string | null;
  bottleCondition20L?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    documentType?: string;
    documentNumber: string;
    phone: string;
    address?: string;
    zone?: string | null;
    district?: string | null;
    subchannel?: string | null;
  };
  items?: SaleItem[];
  payments?: Payment[];
}

export interface CreateSaleInput {
  customerId?: string;
  saleType: SaleType;
  zone?: string;
  district?: string;
  subchannel?: string;
  bottleCondition20L?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    discount?: number;
  }>;
  payment?: {
    amount: number;
    paymentMethod: PaymentMethod;
    operationCode?: string;
  };
  bottlesReturned?: number;
  dueDate?: string;
  notes?: string;
}


export interface SaleListResponse {
  data: Sale[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
