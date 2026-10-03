import { PaymentMethod } from '@/features/cash/types/cash';
import { PaymentStatus } from '@/features/sales/types/sale';

export interface CustomerDebtor {
  id: string;
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  creditLimit: number;
  currentDebt: number;
}

export interface ReceivablePayment {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  operationCode?: string | null;
  paymentDate: string;
}

export interface ReceivableSale {
  id: string;
  saleNumber: string;
  customerId: string;
  saleType: string;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  dueDate?: string | null;
  createdAt: string;
  overdueDays: number;
  isLate: boolean;
  customer: CustomerDebtor;
  payments: ReceivablePayment[];
}

export interface ReceivablesMetrics {
  totalPendingDebt: number;
  overdueDebt: number;
  debtorsCount: number;
  collectedThisMonth: number;
}

export interface ReceivablesResponse {
  metrics: ReceivablesMetrics;
  data: ReceivableSale[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CollectPaymentInput {
  saleId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  operationCode?: string;
  notes?: string;
}

export interface CollectPaymentResult {
  payment: any;
  saleNumber: string;
  customerName: string;
  amountCollected: number;
  previousBalance: number;
  newBalanceDue: number;
  status: PaymentStatus;
  message: string;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  operationCode?: string | null;
  paymentDate: string;
  notes?: string | null;
  sale?: {
    saleNumber: string;
    total: number;
    balanceDue: number;
    customer?: {
      id: string;
      name: string;
      phone: string;
    };
  };
  receivedBy?: {
    firstName: string;
    lastName: string;
  };
}
