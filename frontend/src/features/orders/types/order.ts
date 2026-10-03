import { PaymentMethod } from '@/features/cash/types/cash';
import { SaleType } from '@/features/sales/types/sale';

export type OrderStatus =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'PREPARANDO'
  | 'EN_RUTA'
  | 'ENTREGADO'
  | 'CANCELADO';

export type DeliveryStatus = 'ASIGNADO' | 'EN_RUTA' | 'ENTREGADO' | 'FALLIDO';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: string;
    code?: string;
    name: string;
    unit: string;
    isReturnable?: boolean;
  };
}

export interface Delivery {
  id: string;
  driverId: string;
  status: DeliveryStatus;
  departureAt?: string | null;
  arrivalAt?: string | null;
  bottlesDelivered: number;
  bottlesReturned: number;
  notes?: string | null;
  driver?: {
    firstName: string;
    lastName: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  driverId?: string | null;
  status: OrderStatus;
  deliveryAddress: string;
  deliveryReference?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  scheduledDate?: string | null;
  deliveredAt?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    documentNumber: string;
    phone: string;
    address?: string;
    bottlesHolding: number;
    currentDebt: number;
  };
  driver?: Driver | null;
  items?: OrderItem[];
  deliveries?: Delivery[];
}

export interface CreateOrderInput {
  customerId: string;
  driverId?: string;
  deliveryAddress: string;
  deliveryReference?: string;
  latitude?: number;
  longitude?: number;
  scheduledDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
  }>;
}

export interface DeliverOrderInput {
  bottlesDelivered?: number;
  bottlesReturned?: number;
  saleType?: SaleType;
  paymentMethod?: PaymentMethod;
  operationCode?: string;
  paidAmount?: number;
  notes?: string;
}

export interface OrderListResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
