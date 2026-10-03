export type InventoryMovementType =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE'
  | 'DEVOLUCION'
  | 'MERMA'
  | 'COMPRA'
  | 'VENTA';

export interface InventoryMovement {
  id: string;
  productId: string;
  movementType: InventoryMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: string | number;
  reason: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  product?: {
    id: string;
    code: string;
    name: string;
    unit: string;
    isReturnable?: boolean;
  };
  user?: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export interface KardexListResponse {
  data: InventoryMovement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InventorySummary {
  totalSkus: number;
  totalUnitsInWarehouse: number;
  returnableUnitsInWarehouse: number;
  totalValuedAtCost: number;
  totalValuedAtPrice: number;
  lowStockCount: number;
  criticalProducts: Array<{
    id: string;
    code: string;
    name: string;
    stock: number;
    minStock: number;
    isReturnable: boolean;
  }>;
}

export interface RegisterMovementInput {
  productId: string;
  movementType: InventoryMovementType;
  quantity: number;
  unitCost?: number;
  reason: string;
}
