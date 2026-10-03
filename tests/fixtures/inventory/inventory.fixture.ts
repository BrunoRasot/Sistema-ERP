import { mockReturnableBottle20L } from '../products/products.fixture';

export const mockRegisterMovementEntrada = {
  productId: mockReturnableBottle20L.id,
  movementType: 'ENTRADA' as const,
  quantity: 50,
  unitCost: 4.80,
  reason: 'Producción de lote mañana en planta Ica',
  referenceType: 'PRODUCTION',
};

export const mockRegisterMovementSalida = {
  productId: mockReturnableBottle20L.id,
  movementType: 'SALIDA' as const,
  quantity: 20,
  unitCost: 4.80,
  reason: 'Despacho a móvil ruta Sur',
  referenceType: 'TRANSFER',
};

export const mockRegisterMovementMerma = {
  productId: mockReturnableBottle20L.id,
  movementType: 'MERMA' as const,
  quantity: 2,
  unitCost: 4.80,
  reason: 'Fisura en transporte local',
  referenceType: 'DAMAGE',
};

export const mockRegisterMovementAjuste = {
  productId: mockReturnableBottle20L.id,
  movementType: 'AJUSTE' as const,
  quantity: 118,
  unitCost: 4.80,
  reason: 'Ajuste por conteo físico fin de mes',
  referenceType: 'AUDIT',
};
