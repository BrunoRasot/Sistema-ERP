import { mockCustomerDni, mockCustomerRuc } from '../customers/customers.fixture';
import { mockReturnableBottle20L, mockPackBottles625ml } from '../products/products.fixture';

export const mockCreateSaleContadoDto = {
  customerId: mockCustomerDni.id,
  saleType: 'CONTADO' as const,
  zone: 'Zona Centro',
  district: 'Ica',
  subchannel: 'MOSTRADOR',
  bottleCondition20L: 'RECARGA',
  bottlesReturned: 2,
  items: [
    {
      productId: mockReturnableBottle20L.id,
      quantity: 2,
      unitPrice: 15.00,
      discount: 0,
    },
    {
      productId: mockPackBottles625ml.id,
      quantity: 1,
      unitPrice: 18.00,
      discount: 0,
    },
  ],
  payment: {
    paymentMethod: 'EFECTIVO' as const,
    amount: 48.00,
  },
};

export const mockCreateSaleCreditoDto = {
  customerId: mockCustomerRuc.id,
  saleType: 'CREDITO' as const,
  zone: 'Parque Industrial',
  district: 'Ica',
  subchannel: 'EMPRESA',
  bottleCondition20L: 'RECARGA',
  bottlesReturned: 5,
  items: [
    {
      productId: mockReturnableBottle20L.id,
      quantity: 10,
      unitPrice: 15.00,
      discount: 10.00, // Descuento corporativo S/ 10
    },
  ],
  payment: {
    paymentMethod: 'TRANSFERENCIA' as const,
    amount: 0, // Crédito sin pago inicial
    operationCode: '',
  },
};
