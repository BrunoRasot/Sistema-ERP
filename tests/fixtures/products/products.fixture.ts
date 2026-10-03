export interface TestProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  isReturnable: boolean;
  unit: string;
}

export const mockReturnableBottle20L: TestProduct = {
  id: 'prod-20l-recarga',
  code: 'AGUA-20L-REC',
  name: 'Recarga Bidón 20L Purificada',
  category: 'Bidones Retornables',
  price: 15.00,
  cost: 4.80,
  stock: 120,
  minStock: 25,
  isReturnable: true,
  unit: 'BIDON_20L',
};

export const mockNewBottleWithWater20L: TestProduct = {
  id: 'prod-20l-nuevo',
  code: 'AGUA-20L-NUEVO',
  name: 'Bidón 20L Nuevo con Agua (Envase + Recarga)',
  category: 'Bidones Retornables',
  price: 45.00,
  cost: 22.00,
  stock: 40,
  minStock: 10,
  isReturnable: true,
  unit: 'BIDON_20L',
};

export const mockPackBottles625ml: TestProduct = {
  id: 'prod-pack-625ml',
  code: 'PACK-625ML-15U',
  name: 'Paquete de Botellas 625ml x 15 Unidades',
  category: 'Botellas Descartables',
  price: 18.00,
  cost: 8.50,
  stock: 85,
  minStock: 15,
  isReturnable: false,
  unit: 'PAQUETE',
};

export const mockLowStockProduct: TestProduct = {
  id: 'prod-dispensador',
  code: 'DISP-MANUAL-01',
  name: 'Dispensador Manual de Bomba',
  category: 'Accesorios',
  price: 25.00,
  cost: 11.50,
  stock: 2,
  minStock: 10,
  isReturnable: false,
  unit: 'UNIDAD',
};
