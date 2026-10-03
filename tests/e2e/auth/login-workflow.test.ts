import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

describe('E2E Workflow: Authentication & Session Lifecycle', () => {
  let accessToken: string;
  let refreshToken: string;

  it('Step 1: Attempt login with empty credentials should be rejected', async () => {
    const res = await request(BASE_URL).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('Step 2: Attempt login with wrong password should fail with 401', async () => {
    const res = await request(BASE_URL).post('/auth/login').send({
      email: 'admin@vivelite.pe',
      password: 'IncorrectPassword!',
    });
    expect(res.status).toBe(401);
  });

  it('Step 3: Successful login issues JWT access & refresh tokens', async () => {
    const res = await request(BASE_URL).post('/auth/login').send({
      email: 'admin@vivelite.pe',
      password: 'Admin123!',
    });

    expect(res.status).toBe(200);
    const body = res.body.data || res.body;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.email).toBe('admin@vivelite.pe');
    expect(body.user.role).toBe('SUPER_ADMIN');

    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  it('Step 4: Use access token to access protected dashboard resource', async () => {
    const res = await request(BASE_URL)
      .get('/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const body = res.body.data || res.body;
    expect(body).toBeDefined();
  });

  it('Step 5: Use refresh token to maintain session continuity', async () => {
    const res = await request(BASE_URL).post('/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    const body = res.body.data || res.body;
    expect(body.accessToken).toBeDefined();
  });
});
