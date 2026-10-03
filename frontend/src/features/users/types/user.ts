export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'VENDEDOR' | 'CAJERO' | 'ALMACENERO' | 'REPARTIDOR' | 'SUPERVISOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}
