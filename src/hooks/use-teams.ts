'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/consts/query-keys';
import { createTeam, deleteTeam, getTeams, updateTeam } from '@/services/teams';

const TEAMS_PER_PAGE = 25;

export function useTeamsQuery(page: number) {
  return useQuery({
    queryKey: queryKeys.teams.list(page),
    queryFn: () => getTeams({ page, per_page: TEAMS_PER_PAGE }),
  });
}

export function useTeamOptionsQuery() {
  return useQuery({
    queryKey: queryKeys.teams.options,
    queryFn: () => getTeams({ per_page: 500 }),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}
