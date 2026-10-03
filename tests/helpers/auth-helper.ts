import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vivelite-secret-key-super-secure-change-in-production';

export interface TokenPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'DELIVERY' | 'INVENTORY_MANAGER';
}

export function generateTestToken(payload: TokenPayload, expiresIn: string = '1h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function getAdminAuthHeader(): { Authorization: string } {
  const token = generateTestToken({
    sub: 'usr-admin-uuid-001',
    email: 'admin@vivelite.pe',
    role: 'ADMIN',
  });
  return { Authorization: `Bearer ${token}` };
}

export function getSellerAuthHeader(): { Authorization: string } {
  const token = generateTestToken({
    sub: 'usr-seller-uuid-002',
    email: 'vendedor@vivelite.pe',
    role: 'SELLER',
  });
  return { Authorization: `Bearer ${token}` };
}

export function getExpiredAuthHeader(): { Authorization: string } {
  const token = jwt.sign(
    { sub: 'usr-expired', email: 'expired@vivelite.pe', role: 'SELLER' },
    JWT_SECRET,
    { expiresIn: '-1s' },
  );
  return { Authorization: `Bearer ${token}` };
}

export function getInvalidSignatureHeader(): { Authorization: string } {
  const token = jwt.sign(
    { sub: 'usr-tampered', email: 'tampered@vivelite.pe', role: 'ADMIN' },
    'wrong-secret-key',
    { expiresIn: '1h' },
  );
  return { Authorization: `Bearer ${token}` };
}
