import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/services/api/client';
import { getUser, getUsers } from './users';

vi.mock('@/services/api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('user service', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('sends name filters as filter_names', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

    await getUsers({ page: 2, per_page: 25, filterNames: 'ada' });

    expect(api.get).toHaveBeenCalledWith('/v1/users', {
      params: { page: 2, per_page: 25, filter_names: 'ada' },
    });
  });

  it('unwraps a user detail envelope', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { id: 8, name: 'Ada', email: 'ada@example.com' } },
    });

    await expect(getUser(8)).resolves.toMatchObject({ id: 8, email: 'ada@example.com' });
    expect(api.get).toHaveBeenCalledWith('/v1/users/8');
  });
});
