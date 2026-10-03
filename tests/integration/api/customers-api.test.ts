import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

describe('Integration Test: Customers API Endpoints', () => {
  let authToken: string;
  let testCustomerId: string;
  const uniqueDocNumber = String(Math.floor(10000000 + Math.random() * 90000000));

  beforeAll(async () => {
    const loginRes = await request(BASE_URL)
      .post('/auth/login')
      .send({
        email: 'admin@vivelite.pe',
        password: 'Admin123!',
      });

    const body = loginRes.body.data || loginRes.body;
    authToken = body.accessToken;
  });

  it('GET /customers - should reject unauthenticated requests with 401', async () => {
    const res = await request(BASE_URL).get('/customers');
    expect(res.status).toBe(401);
  });

  it('POST /customers - should validate DNI and create new customer', async () => {
    const res = await request(BASE_URL)
      .post('/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        documentType: 'DNI',
        documentNumber: uniqueDocNumber,
        name: 'Cliente Prueba QA',
        phone: '956000111',
        address: 'Av. Test 123, Ica',
        customerType: 'HOGAR',
      });

    expect(res.status).toBe(201);
    const data = res.body.data || res.body;
    expect(data).toHaveProperty('id');
    expect(data.documentNumber).toBe(uniqueDocNumber);
    testCustomerId = data.id;
  });

  it('POST /customers - should reject duplicate customer document with 409 Conflict', async () => {
    const res = await request(BASE_URL)
      .post('/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        documentType: 'DNI',
        documentNumber: uniqueDocNumber, // same DNI
        name: 'Cliente Duplicado QA',
        phone: '956000222',
        address: 'Av. Test 456, Ica',
      });

    expect(res.status).toBe(409);
  });

  it('GET /customers/:id - should return single customer detail', async () => {
    const res = await request(BASE_URL)
      .get(`/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data || res.body;
    expect(data.id).toBe(testCustomerId);
    expect(data.name).toBe('Cliente Prueba QA');
  });

  it('GET /customers/:id/bottles - should retrieve customer bottle balance history', async () => {
    const res = await request(BASE_URL)
      .get(`/customers/${testCustomerId}/bottles`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });
});
