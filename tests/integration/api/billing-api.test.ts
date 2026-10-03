import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

describe('Integration Test: Billing API Endpoints (SUNAT Invoicing)', () => {
  let authToken: string;

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

  it('GET /billing - should reject unauthenticated requests with 401', async () => {
    const res = await request(BASE_URL).get('/billing');
    expect(res.status).toBe(401);
  });

  it('GET /billing - should return electronic documents list when authenticated', async () => {
    const res = await request(BASE_URL)
      .get('/billing')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const body = res.body.data || res.body;
    expect(Array.isArray(body) || Array.isArray(body.items) || Array.isArray(body.data)).toBe(true);
  });

  it('GET /billing/uninvoiced-sales - should return list of sales pending electronic invoice', async () => {
    const res = await request(BASE_URL)
      .get('/billing/uninvoiced-sales')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const body = res.body.data || res.body;
    expect(Array.isArray(body)).toBe(true);
  });

  it('POST /billing/emit - should return 404 when attempting to invoice non-existent sale ID', async () => {
    const res = await request(BASE_URL)
      .post('/billing/emit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        saleId: '00000000-0000-0000-0000-000000000000',
        invoiceType: 'BOLETA',
      });

    expect(res.status).toBe(404);
  });
});
