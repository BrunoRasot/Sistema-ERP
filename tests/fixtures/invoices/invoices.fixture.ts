export const mockBoletaData = {
  invoiceType: 'BOLETA' as const,
  series: 'B001',
  correlative: 142,
  issueDate: new Date('2026-10-02T10:30:00Z'),
  customer: {
    documentType: 'DNI',
    documentNumber: '44556677',
    name: 'Rosa Palomino Carpio',
    address: 'Calle San Martín 320, Ica',
  },
  subtotal: 40.68,
  tax: 7.32,
  total: 48.00,
  items: [
    {
      name: 'Recarga Bidón 20L Purificada',
      quantity: 2,
      unitPrice: 15.00,
      totalPrice: 30.00,
    },
    {
      name: 'Paquete de Botellas 625ml x 15 Unidades',
      quantity: 1,
      unitPrice: 18.00,
      totalPrice: 18.00,
    },
  ],
};

export const mockFacturaData = {
  invoiceType: 'FACTURA' as const,
  series: 'F001',
  correlative: 89,
  issueDate: new Date('2026-10-02T11:00:00Z'),
  customer: {
    documentType: 'RUC',
    documentNumber: '20608899001',
    name: 'Empresa Constructora Ica S.A.C.',
    address: 'Av. Cutervo 850, Ica',
  },
  subtotal: 118.64,
  tax: 21.36,
  total: 140.00,
  items: [
    {
      name: 'Recarga Bidón 20L Purificada',
      quantity: 10,
      unitPrice: 14.00,
      totalPrice: 140.00,
    },
  ],
};
