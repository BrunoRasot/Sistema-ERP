export const createJwtServiceMock = () => ({
  sign: jest.fn().mockImplementation((payload: any, options?: any) => {
    return `mock.jwt.token.${payload?.sub || 'default-user'}.${options?.expiresIn || '15m'}`;
  }),
  signAsync: jest.fn().mockImplementation(async (payload: any, options?: any) => {
    return `mock.jwt.token.${payload?.sub || 'default-user'}.${options?.expiresIn || '15m'}`;
  }),
  verify: jest.fn().mockImplementation((token: string) => {
    if (token.includes('invalid') || token.includes('expired')) {
      throw new Error('Invalid token');
    }
    return {
      sub: 'usr-admin-uuid-001',
      email: 'admin@vivelite.pe',
      role: 'ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
  }),
  verifyAsync: jest.fn().mockImplementation(async (token: string) => {
    if (token.includes('invalid') || token.includes('expired')) {
      throw new Error('Invalid token');
    }
    return {
      sub: 'usr-admin-uuid-001',
      email: 'admin@vivelite.pe',
      role: 'ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
  }),
  decode: jest.fn().mockImplementation((token: string) => ({
    sub: 'usr-admin-uuid-001',
    email: 'admin@vivelite.pe',
    role: 'ADMIN',
  })),
});
