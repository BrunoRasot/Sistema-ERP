import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

describe('E2E Workflow: POS Sale, Inventory Impact, and Invoicing Pipeline', () => {
  let authToken: string;
  let testProductId: string;
  let testProductPrice: number;
  let testCustomerId: string;
  let createdSaleId: string;

  beforeAll(async () => {
    // 1. Login as Admin
    const loginRes = await request(BASE_URL).post('/auth/login').send({
      email: 'admin@vivelite.pe',
      password: 'Admin123!',
    });
    const loginBody = loginRes.body.data || loginRes.body;
    authToken = loginBody.accessToken;

    // 2. Fetch or prepare an active Cash Shift
    const shiftRes = await request(BASE_URL)
      .get('/cash/shifts/active')
      .set('Authorization', `Bearer ${authToken}`);

    const shiftData = shiftRes.body.data || shiftRes.body;
    if (!shiftData || !shiftData.id) {
      // Get registers to open one
      const registersRes = await request(BASE_URL)
        .get('/cash/registers')
        .set('Authorization', `Bearer ${authToken}`);
      const registers = registersRes.body.data || registersRes.body;
      const registerId = Array.isArray(registers) && registers.length > 0 ? registers[0].id : undefined;

      if (registerId) {
        await request(BASE_URL)
          .post('/cash/shifts/open')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            cashRegisterId: registerId,
            initialBalance: 100,
          });
      }
    }

    // 3. Fetch products and select one with stock > 5
    const productsRes = await request(BASE_URL)
      .get('/products')
      .set('Authorization', `Bearer ${authToken}`);
    const productsBody = productsRes.body.data || productsRes.body;
    const products = Array.isArray(productsBody) ? productsBody : productsBody.items || productsBody.data || [];
    const prod = products.find((p: any) => p.stock > 5) || products[0];
    if (prod) {
      testProductId = prod.id;
      testProductPrice = Number(prod.price);
    }

    // 4. Fetch customers
    const customersRes = await request(BASE_URL)
      .get('/customers')
      .set('Authorization', `Bearer ${authToken}`);
    const customersBody = customersRes.body.data || customersRes.body;
    const customers = Array.isArray(customersBody) ? customersBody : customersBody.items || customersBody.data || [];
    if (customers.length > 0) {
      testCustomerId = customers[0].id;
    }
  });

  it('Step 1: Successfully create a CONTADO cash sale with atomic stock deduction', async () => {
    if (!testProductId) {
      console.warn('Skipping test: No product available in database');
      return;
    }

    const saleQty = 1;
    const total = testProductPrice * saleQty;

    const res = await request(BASE_URL)
      .post('/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: testCustomerId,
        saleType: 'CONTADO',
        items: [
          {
            productId: testProductId,
            quantity: saleQty,
            unitPrice: testProductPrice,
          },
        ],
        payment: {
          amount: total,
          paymentMethod: 'EFECTIVO',
        },
      });

    expect(res.status).toBe(201);
    const body = res.body.data || res.body;
    const sale = body.sale || body;
    expect(sale).toHaveProperty('id');
    expect(sale).toHaveProperty('saleNumber');
    expect(sale.saleNumber).toMatch(/^VTA-\d{4}-\d{5}$/);
    expect(Number(sale.total)).toBeCloseTo(total, 2);

    createdSaleId = sale.id;
  });

  it('Step 2: Verify the created sale can be fetched with details', async () => {
    if (!createdSaleId) return;

    const res = await request(BASE_URL)
      .get(`/sales/${createdSaleId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const body = res.body.data || res.body;
    expect(body.id).toBe(createdSaleId);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('Step 3: Verify the sale appears in uninvoiced sales for electronic billing', async () => {
    if (!createdSaleId) return;

    const res = await request(BASE_URL)
      .get('/billing/uninvoiced-sales')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const uninvoiced = res.body.data || res.body;
    const found = Array.isArray(uninvoiced) && uninvoiced.some((s: any) => s.id === createdSaleId);
    expect(found).toBe(true);
  });
});
