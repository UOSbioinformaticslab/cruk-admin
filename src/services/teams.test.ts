import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/services/api/client';
import { addUserToTeam } from './teams';

vi.mock('@/services/api/client', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('team service', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('sends a numeric user id when adding a member', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ok: true } });

    await addUserToTeam(4, 12, ['developer']);

    expect(api.post).toHaveBeenCalledWith('/v1/teams/4/users', {
      userId: 12,
      roles: ['developer'],
    });
  });
});
