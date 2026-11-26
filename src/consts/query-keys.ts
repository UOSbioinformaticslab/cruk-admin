export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (page: number, search: string) => ['users', page, search] as const,
    detail: (id: number) => ['user', id] as const,
  },
  teams: {
    all: ['teams'] as const,
    list: (page: number) => ['teams', page] as const,
    options: ['teams', 'all'] as const,
  },
  roles: {
    all: ['roles'] as const,
    list: (page: number) => ['roles', page] as const,
    options: ['roles', 'all'] as const,
  },
  cancerTypeFilters: {
    all: ['cancer-type-filters'] as const,
  },
};
