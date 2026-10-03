import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

describe('Integration Test: Auth API Endpoints', () => {
  it('POST /auth/login - should fail with 401 on invalid password', async () => {
    const res = await request(BASE_URL)
      .post('/auth/login')
      .send({
        email: 'admin@vivelite.pe',
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
  });

  it('POST /auth/login - should fail with 400 on invalid email structure', async () => {
    const res = await request(BASE_URL)
      .post('/auth/login')
      .send({
        email: 'not-an-email',
        password: 'Admin123!',
      });

    expect(res.status).toBe(400);
  });

  it('POST /auth/login - should authenticate successfully with valid credentials and return tokens', async () => {
    const res = await request(BASE_URL)
      .post('/auth/login')
      .send({
        email: 'admin@vivelite.pe',
        password: 'Admin123!',
      });

    expect(res.status).toBe(200);
    // NestJS response envelope: { success: true, data: { accessToken, refreshToken, user } }
    const body = res.body.data || res.body;
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    expect(body.user.email).toBe('admin@vivelite.pe');
  });

  it('POST /auth/refresh - should issue new access token from valid refresh token', async () => {
    // 1. Login first
    const loginRes = await request(BASE_URL)
      .post('/auth/login')
      .send({
        email: 'admin@vivelite.pe',
        password: 'Admin123!',
      });

    const loginData = loginRes.body.data || loginRes.body;
    const refreshToken = loginData.refreshToken;

    // 2. Request new token
    const refreshRes = await request(BASE_URL)
      .post('/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    const refreshData = refreshRes.body.data || refreshRes.body;
    expect(refreshData).toHaveProperty('accessToken');
  });
});
