export type DocumentType = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE' | 'OTRO';
export type CustomerType = 'HOGAR' | 'EMPRESA' | 'DISTRIBUIDOR';
export type LoyaltyTier = 'BRONCE' | 'PLATA' | 'ORO' | 'DIAMANTE';
export type BottleTransactionType = 'ENTREGA' | 'DEVOLUCION' | 'PERDIDA' | 'DANADO' | 'AJUSTE';

export interface Customer {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  name: string;
  businessName?: string | null;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  address: string;
  reference?: string | null;
  zone?: string | null;
  district?: string | null;
  subchannel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  customerType: CustomerType;
  loyaltyTier: LoyaltyTier;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string | null;
  bottlesHolding: number;
  creditLimit: string | number;
  currentDebt: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface BottleTransaction {
  id: string;
  customerId: string;
  type: BottleTransactionType;
  quantity: number;
  balanceAfter: number;
  notes?: string | null;
  createdAt: string;
  recordedBy?: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export interface CustomerListResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCustomerInput {
  documentType: DocumentType;
  documentNumber: string;
  name: string;
  businessName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  reference?: string;
  zone?: string;
  district?: string;
  subchannel?: string;
  customerType: CustomerType;
  creditLimit?: number;
  notes?: string;
}

export interface RegisterBottleInput {
  type: BottleTransactionType;
  quantity: number;
  notes?: string;
}
