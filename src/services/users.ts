import { api } from '@/services/api/client';
import { unwrapEntity } from '@/utils/api-response';
import type { User } from '@/interfaces';

export interface UserListParams {
  page?: number;
  per_page?: number;
  filterNames?: string;
  filter_names?: string;
}

export async function getUsers(params?: UserListParams) {
  const { filterNames, ...rest } = params ?? {};
  const response = await api.get('/v1/users', {
    params: {
      ...rest,
      ...(filterNames ? { filter_names: filterNames } : {}),
    },
  });
  return response.data;
}

export async function getUser(id: number) {
  const response = await api.get(`/v1/users/${id}`);
  return unwrapEntity<User>(response.data) ?? response.data;
}

export async function createUser(data: Record<string, unknown>) {
  const response = await api.post('/v1/users', data);
  return response.data;
}

export async function updateUser(id: number, data: Record<string, unknown>) {
  const response = await api.put(`/v1/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: number) {
  const response = await api.delete(`/v1/users/${id}`);
  return response.data;
}

export async function assignUserRoles(userId: number, roles: string[]) {
  const response = await api.post(`/v1/users/${userId}/roles`, { roles });
  return response.data;
}

export async function updateUserRoles(userId: number, roles: Record<string, boolean>) {
  const response = await api.patch(`/v1/users/${userId}/roles`, { roles });
  return response.data;
}
