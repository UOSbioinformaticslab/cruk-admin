import { api } from '@/services/api/client';

export interface RoleListParams {
  page?: number;
  per_page?: number;
}

export async function getRoles(params?: RoleListParams) {
  const response = await api.get('/v1/roles', { params });
  return response.data;
}

export async function getRole(id: number) {
  const response = await api.get(`/v1/roles/${id}`);
  return response.data;
}

export async function createRole(data: Record<string, unknown>) {
  const response = await api.post('/v1/roles', data);
  return response.data;
}

export async function updateRole(id: number, data: Record<string, unknown>) {
  const response = await api.put(`/v1/roles/${id}`, data);
  return response.data;
}

export async function deleteRole(id: number) {
  const response = await api.delete(`/v1/roles/${id}`);
  return response.data;
}
