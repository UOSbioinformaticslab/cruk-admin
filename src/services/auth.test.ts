import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/consts/storage';
import { api } from '@/services/api/client';
import { login, logout } from './auth';

vi.mock('@/services/api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  setToken: (token: string | null) => {
    if (token) {
      localStorage.setItem('auth_token', token);
      return;
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
  getToken: () => localStorage.getItem('auth_token'),
}));

describe('auth service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockReset();
  });

  it('stores a nested access token and replaces the user with the full profile', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          access_token: 'nested-token',
          user: { id: 7, name: 'Ada', email: 'ada@example.com' },
        },
      },
    });
    vi.mocked(api.get).mockResolvedValue({
      data: {
        id: 7,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        firstname: 'Ada',
        lastname: 'Lovelace',
      },
    });

    await login('ada@example.com', 'secret', 'cruk');

    expect(api.post).toHaveBeenCalledWith('/v1/auth/login', {
      email: 'ada@example.com',
      password: 'secret',
      provider: 'cruk',
    });
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('nested-token');
    expect(JSON.parse(localStorage.getItem(AUTH_USER_KEY) ?? '{}')).toMatchObject({
      id: 7,
      firstname: 'Ada',
    });
  });

  it('keeps the login user when the profile request fails', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { token: 'flat-token', user: { id: 2, name: 'Grace', email: 'grace@example.com' } },
    });
    vi.mocked(api.get).mockRejectedValue(new Error('unavailable'));

    await login('grace@example.com', 'secret');

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('flat-token');
    expect(JSON.parse(localStorage.getItem(AUTH_USER_KEY) ?? '{}')).toMatchObject({ id: 2 });
  });

  it('clears the local session when logout fails', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'secret');
    localStorage.setItem(AUTH_USER_KEY, '{"id":1}');
    vi.mocked(api.post).mockRejectedValue(new Error('offline'));

    await logout();

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
  });
});
