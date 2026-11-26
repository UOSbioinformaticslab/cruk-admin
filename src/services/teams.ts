import { api } from '@/services/api/client';

export interface TeamListParams {
  page?: number;
  per_page?: number;
  sort?: string;
}

export async function getTeams(params?: TeamListParams) {
  const response = await api.get('/v1/teams', { params });
  return response.data;
}

export async function getTeam(id: number) {
  const response = await api.get(`/v1/teams/${id}`);
  return response.data;
}

export async function createTeam(data: Record<string, unknown>) {
  const response = await api.post('/v1/teams', data);
  return response.data;
}

export async function updateTeam(id: number, data: Record<string, unknown>) {
  const response = await api.put(`/v1/teams/${id}`, data);
  return response.data;
}

export async function deleteTeam(id: number) {
  const response = await api.delete(`/v1/teams/${id}`);
  return response.data;
}

export async function addUserToTeam(teamId: number, userId: number, roles: string[]) {
  const response = await api.post(`/v1/teams/${teamId}/users`, {
    userId: Number(userId),
    roles,
  });
  return response.data;
}

export async function removeUserFromTeam(teamId: number, userId: number) {
  const response = await api.delete(`/v1/teams/${teamId}/users/${userId}`);
  return response.data;
}
