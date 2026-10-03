export type CashShiftStatus = 'ABIERTA' | 'CERRADA';
export type CashMovementType = 'INGRESO' | 'EGRESO';
export type PaymentMethod = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'TRANSFERENCIA';

export interface CashRegister {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  shifts?: CashShift[];
}

export interface CashMovement {
  id: string;
  shiftId: string;
  type: CashMovementType;
  amount: number;
  paymentMethod: PaymentMethod;
  reason: string;
  createdAt: string;
  recordedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface ShiftSummary {
  initialBalance: number;
  cashSalesTotal: number;
  yapePlinSalesTotal: number;
  cardSalesTotal: number;
  transferSalesTotal: number;
  totalSalesAllMethods: number;
  manualIncomes: number;
  manualExpenses: number;
  expectedCashInBox: number;
}

export interface CashShift {
  id: string;
  cashRegisterId: string;
  openedById: string;
  closedById?: string | null;
  openedAt: string;
  closedAt?: string | null;
  initialBalance: number;
  expectedBalance?: number | null;
  actualBalance?: number | null;
  difference?: number | null;
  status: CashShiftStatus;
  notes?: string | null;
  cashRegister?: CashRegister;
  summary?: ShiftSummary;
}

export interface OpenShiftInput {
  cashRegisterId: string;
  initialBalance: number;
  notes?: string;
}

export interface CloseShiftInput {
  actualBalance: number;
  notes?: string;
}
