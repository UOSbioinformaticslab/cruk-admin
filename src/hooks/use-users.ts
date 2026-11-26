'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/consts/query-keys';
import { deleteUser, getUser, getUsers } from '@/services/users';

const USERS_PER_PAGE = 25;

export function useUsersQuery(
  page: number,
  search: string,
  onResult?: (result: unknown) => void
) {
  return useQuery({
    queryKey: queryKeys.users.list(page, search),
    queryFn: async () => {
      const result = await getUsers({
        page,
        per_page: USERS_PER_PAGE,
        filterNames: search.trim().length >= 3 ? search.trim() : undefined,
      });
      onResult?.(result);
      return result;
    },
  });
}

export function useUserQuery(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? 0),
    queryFn: () => getUser(id!),
    enabled: enabled && id != null,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
