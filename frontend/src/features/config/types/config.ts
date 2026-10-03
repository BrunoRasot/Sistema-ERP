export interface SubChannel {
  id: number;
  name: string;
  districtId: number;
  district?: District;
  createdAt?: string;
  updatedAt?: string;
}

export interface District {
  id: number;
  name: string;
  zoneId: number;
  zone?: Zone;
  subChannels?: SubChannel[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Zone {
  id: number;
  name: string;
  districts?: District[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BottleCondition {
  id: number;
  code: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BottleStock {
  id: number;
  productId: number;
  zoneId?: number;
  zone?: Zone;
  totalEmpty: number;
  totalFull: number;
  threshold?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BottleSummary {
  totalInCustomers: number;
  totalEmptyInPlant: number;
  totalFullInPlant: number;
  totalBottlesInCirculation: number;
  customersWithBottlesCount: number;
  totalCustomers: number;
  recentTransactionsCount: number;
}

export interface GlobalBottleTransaction {
  id: string;
  customerId: string;
  type: 'ENTREGA' | 'DEVOLUCION' | 'PERDIDA' | 'DANADO' | 'AJUSTE';
  quantity: number;
  balanceAfter: number;
  orderId?: string;
  saleId?: string;
  notes?: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    documentNumber: string;
    phone: string;
    zone?: string;
    district?: string;
    subchannel?: string;
    bottlesHolding: number;
  };
  sale?: {
    saleNumber: string;
    total: number;
  };
  recordedBy?: {
    firstName: string;
    lastName: string;
  };
}
