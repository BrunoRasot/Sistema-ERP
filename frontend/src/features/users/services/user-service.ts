import { apiClient } from '@/lib/api/client';
import { SystemUser, CreateUserInput, UpdateUserInput, UserRole } from '../types/user';

export const userService = {
  async getUsers(params: { search?: string; role?: UserRole } = {}): Promise<SystemUser[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);

    return apiClient<SystemUser[]>(`/users?${query.toString()}`);
  },

  async getUserById(id: string): Promise<SystemUser> {
    return apiClient<SystemUser>(`/users/${id}`);
  },

  async createUser(input: CreateUserInput): Promise<SystemUser> {
    return apiClient<SystemUser>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<SystemUser> {
    return apiClient<SystemUser>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async toggleUserStatus(id: string): Promise<SystemUser> {
    return apiClient<SystemUser>(`/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
