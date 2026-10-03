export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VENDEDOR' | 'CAJERO' | 'ALMACENERO' | 'REPARTIDOR';
  status: 'ACTIVE' | 'INACTIVE';
  branchId?: string;
}

export const mockAdminUser: TestUser = {
  id: 'usr-admin-001',
  email: 'admin@vivelite.pe',
  password: 'Password123!',
  firstName: 'Carlos',
  lastName: 'Mendoza',
  role: 'ADMIN',
  status: 'ACTIVE',
  branchId: 'branch-ica-001',
};

export const mockSellerUser: TestUser = {
  id: 'usr-seller-001',
  email: 'vendedor@vivelite.pe',
  password: 'Password123!',
  firstName: 'María',
  lastName: 'Gómez',
  role: 'VENDEDOR',
  status: 'ACTIVE',
  branchId: 'branch-ica-001',
};

export const mockInactiveUser: TestUser = {
  id: 'usr-inactive-001',
  email: 'inactivo@vivelite.pe',
  password: 'Password123!',
  firstName: 'Juan',
  lastName: 'Bloqueado',
  role: 'VENDEDOR',
  status: 'INACTIVE',
};
