'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/consts/query-keys';
import { createRole, deleteRole, getRoles, updateRole } from '@/services/roles';

const ROLES_PER_PAGE = 25;

export function useRolesQuery(page: number) {
  return useQuery({
    queryKey: queryKeys.roles.list(page),
    queryFn: () => getRoles({ page, per_page: ROLES_PER_PAGE }),
  });
}

export function useRoleOptionsQuery() {
  return useQuery({
    queryKey: queryKeys.roles.options,
    queryFn: () => getRoles({ per_page: 500 }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}
