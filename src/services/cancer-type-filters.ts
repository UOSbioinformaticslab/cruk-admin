import { api } from '@/services/api/client';

export interface CancerTypeFilterListParams {
  parent_id?: number;
  level?: number;
}

export async function getCancerTypeFilters(params?: CancerTypeFilterListParams) {
  const response = await api.get('/v1/cancer-type-filters', { params });
  return response.data;
}

export async function getCancerTypeFilter(id: number) {
  const response = await api.get(`/v1/cancer-type-filters/${id}`);
  return response.data;
}

export async function createCancerTypeFilter(data: Record<string, unknown>) {
  const response = await api.post('/v1/cancer-type-filters', data);
  return response.data;
}

export async function updateCancerTypeFilter(id: number, data: Record<string, unknown>) {
  const response = await api.put(`/v1/cancer-type-filters/${id}`, data);
  return response.data;
}
