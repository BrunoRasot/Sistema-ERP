export function createPrismaMock() {
  const mockModel = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  });

  const prismaMock: any = {
    user: mockModel(),
    customer: mockModel(),
    product: mockModel(),
    sale: mockModel(),
    saleItem: mockModel(),
    payment: mockModel(),
    cashShift: mockModel(),
    cashRegister: mockModel(),
    cashMovement: mockModel(),
    inventoryMovement: mockModel(),
    bottleTransaction: mockModel(),
    bottleStock: mockModel(),
    electronicDocument: mockModel(),
    auditLog: mockModel(),
    importBatch: mockModel(),
    importLog: mockModel(),
    $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
      if (typeof cb === 'function') {
        return cb(prismaMock);
      }
      return Promise.all(cb);
    }),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn().mockResolvedValue(1),
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
  };

  return prismaMock;
}
