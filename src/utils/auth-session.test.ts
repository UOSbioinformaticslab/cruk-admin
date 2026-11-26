import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_USER_KEY } from '@/consts/storage';
import type { User } from '@/interfaces';
import {
  canManageUserAssignments,
  getAuthUser,
  setAuthUser,
  setAuthUserFromLoginResponse,
} from './auth-session';

const user = { id: 3, name: 'Ada', email: 'ada@example.com' } as User;

describe('auth session storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and reads the signed-in user', () => {
    setAuthUser(user);
    expect(getAuthUser()).toEqual(user);
  });

  it('clears the stored user', () => {
    setAuthUser(user);
    setAuthUser(null);
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
    expect(getAuthUser()).toBeNull();
  });

  it('returns null when stored JSON is invalid', () => {
    localStorage.setItem(AUTH_USER_KEY, '{');
    expect(getAuthUser()).toBeNull();
  });

  it('reads the user from a nested login payload', () => {
    setAuthUserFromLoginResponse({ data: { user } });
    expect(getAuthUser()).toEqual(user);
  });

  it('falls back to an entity envelope', () => {
    setAuthUserFromLoginResponse({ data: user });
    expect(getAuthUser()?.id).toBe(3);
  });
});

describe('canManageUserAssignments', () => {
  it('allows admins and the superadmin role', () => {
    expect(canManageUserAssignments(null)).toBe(false);
    expect(canManageUserAssignments({ ...user, is_admin: 1 })).toBe(true);
    expect(canManageUserAssignments({ ...user, is_admin: true })).toBe(true);
    expect(
      canManageUserAssignments({
        ...user,
        is_admin: 0,
        roles: [{ id: 1, name: 'hdruk.superadmin', enabled: true }],
      })
    ).toBe(true);
  });

  it('rejects accounts without an admin flag or superadmin role', () => {
    expect(
      canManageUserAssignments({
        ...user,
        roles: [{ id: 2, name: 'developer', enabled: true }],
      })
    ).toBe(false);
  });
});
