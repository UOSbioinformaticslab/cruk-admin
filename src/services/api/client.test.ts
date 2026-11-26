import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/consts/storage';
import { getToken, setToken } from './client';

describe('auth token storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores the bearer token', () => {
    setToken('secret');
    expect(getToken()).toBe('secret');
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('secret');
  });

  it('clears the token and the stored user', () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'secret');
    localStorage.setItem(AUTH_USER_KEY, '{"id":1}');

    setToken(null);

    expect(getToken()).toBeNull();
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
  });
});
