'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/consts/query-keys';
import {
  createCancerTypeFilter,
  getCancerTypeFilters,
  updateCancerTypeFilter,
} from '@/services/cancer-type-filters';

export function useCancerTypeFiltersQuery() {
  return useQuery({
    queryKey: queryKeys.cancerTypeFilters.all,
    queryFn: () => getCancerTypeFilters(),
  });
}

export function useCreateCancerTypeFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createCancerTypeFilter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cancerTypeFilters.all });
    },
  });
}

export function useUpdateCancerTypeFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateCancerTypeFilter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cancerTypeFilters.all });
    },
  });
}
