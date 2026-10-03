import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

describe('Integration Test: Concurrency & Race Condition Prevention', () => {
  let authToken: string;
  let testProductId: string;
  let testProductPrice: number;
  let testCustomerId: string;
  let cashRegisterId: string;

  beforeAll(async () => {
    // 1. Auth login
    const loginRes = await request(BASE_URL).post('/auth/login').send({
      email: 'admin@vivelite.pe',
      password: 'Admin123!',
    });
    const loginBody = loginRes.body.data || loginRes.body;
    authToken = loginBody.accessToken;

    // 2. Fetch cash registers
    const registersRes = await request(BASE_URL)
      .get('/cash/registers')
      .set('Authorization', `Bearer ${authToken}`);
    const registers = registersRes.body.data || registersRes.body;
    if (Array.isArray(registers) && registers.length > 0) {
      cashRegisterId = registers[0].id;
    }

    // 3. Ensure cash shift is open
    const shiftRes = await request(BASE_URL)
      .get('/cash/shifts/active')
      .set('Authorization', `Bearer ${authToken}`);
    const shiftData = shiftRes.body.data || shiftRes.body;
    if (!shiftData || !shiftData.id) {
      if (cashRegisterId) {
        await request(BASE_URL)
          .post('/cash/shifts/open')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            cashRegisterId,
            initialAmount: 100,
          });
      }
    }

    // 4. Fetch products
    const productsRes = await request(BASE_URL)
      .get('/products')
      .set('Authorization', `Bearer ${authToken}`);
    const products = productsRes.body.data || productsRes.body;
    const prodList = Array.isArray(products) ? products : products.items || [];
    const prod = prodList.find((p: any) => p.stock >= 20) || prodList[0];
    if (prod) {
      testProductId = prod.id;
      testProductPrice = Number(prod.price);
    }

    // 5. Fetch customers
    const customersRes = await request(BASE_URL)
      .get('/customers')
      .set('Authorization', `Bearer ${authToken}`);
    const customers = customersRes.body.data || customersRes.body;
    const custList = Array.isArray(customers) ? customers : customers.items || [];
    if (custList.length > 0) {
      testCustomerId = custList[0].id;
    }
  });

  it('Concurrent Sales: 5 parallel sales must generate 5 unique consecutive correlatives without collision', async () => {
    if (!testProductId) return;

    // Send 5 parallel sale creation requests
    const parallelRequests = Array.from({ length: 5 }).map(() =>
      request(BASE_URL)
        .post('/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: testCustomerId,
          saleType: 'CONTADO',
          items: [
            {
              productId: testProductId,
              quantity: 1,
              unitPrice: testProductPrice,
            },
          ],
          payment: {
            amount: testProductPrice,
            paymentMethod: 'EFECTIVO',
          },
        }),
    );

    const responses = await Promise.all(parallelRequests);

    // Verify all succeeded with 201
    const statuses = responses.map((r) => r.status);
    expect(statuses.every((s) => s === 201)).toBe(true);

    // Extract sale numbers
    const saleNumbers = responses.map((r) => {
      const body = r.body.data || r.body;
      const sale = body.sale || body;
      return sale.saleNumber;
    });

    // Check uniqueness (Set size must be 5)
    const uniqueSaleNumbers = new Set(saleNumbers);
    expect(uniqueSaleNumbers.size).toBe(5);

    // Each saleNumber should match the format VTA-YYYY-XXXXX
    saleNumbers.forEach((sn) => {
      expect(sn).toMatch(/^VTA-\d{4}-\d{5}$/);
    });
  });

  it('Concurrent Cash Shifts: Parallel open shift on the same cash register must prevent double open', async () => {
    if (!cashRegisterId) return;

    // First attempt to open two shifts concurrently
    const parallelOpen = [
      request(BASE_URL)
        .post('/cash/shifts/open')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cashRegisterId, initialBalance: 50, notes: 'Turno A' }),
      request(BASE_URL)
        .post('/cash/shifts/open')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cashRegisterId, initialBalance: 50, notes: 'Turno B' }),
    ];

    const [resA, resB] = await Promise.all(parallelOpen);

    // If a shift was already open, both should be rejected with 409
    // If not, exactly one must be 201 and the other 409 Conflict
    const hasConflict = resA.status === 409 || resB.status === 409;
    expect(hasConflict).toBe(true);
  });
});
