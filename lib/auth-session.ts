import { unwrapEntity } from './api-response';
import type { User } from './types';

const AUTH_USER_KEY = 'auth_user';

export function setAuthUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuthUserFromLoginResponse(response: unknown) {
  if (!response || typeof response !== 'object') return;
  const record = response as Record<string, unknown>;
  const nested = record.data;
  const user =
    (nested && typeof nested === 'object'
      ? (nested as Record<string, unknown>).user
      : record.user) ?? unwrapEntity<User>(response);

  if (user && typeof user === 'object' && 'id' in user) {
    setAuthUser(user as User);
  }
}

/** Whether the account can assign global roles / teams via the admin API. */
export function canManageUserAssignments(authUser: User | null): boolean {
  if (!authUser) return false;
  if (Number(authUser.is_admin) === 1) return true;
  return authUser.roles?.some((r) => r.name === 'hdruk.superadmin') ?? false;
}
