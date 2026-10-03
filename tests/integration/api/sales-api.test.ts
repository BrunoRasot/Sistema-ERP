import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

describe('Integration Test: Sales API Endpoints', () => {
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

  it('GET /sales - should reject unauthenticated requests with 401', async () => {
    const res = await request(BASE_URL).get('/sales');
    expect(res.status).toBe(401);
  });

  it('GET /sales - should return sales list when authenticated', async () => {
    const res = await request(BASE_URL)
      .get('/sales')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const body = res.body.data || res.body;
    expect(Array.isArray(body) || Array.isArray(body.items) || Array.isArray(body.data)).toBe(true);
  });

  it('POST /sales - should return 400 when items array is missing or empty', async () => {
    const res = await request(BASE_URL)
      .post('/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        saleType: 'CONTADO',
        items: [],
      });

    expect(res.status).toBe(400);
  });

  it('GET /sales/export/excel - should return spreadsheet binary format', async () => {
    const res = await request(BASE_URL)
      .get('/sales/export/excel')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('GET /sales/:id - should return 404 for non-existent sale ID', async () => {
    const res = await request(BASE_URL)
      .get('/sales/non-existent-uuid')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});
