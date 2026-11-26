import { getDefaultAuthProvider } from '@/config/api';
import { api, getToken, setToken } from '@/services/api/client';
import { getUser } from '@/services/users';
import { setAuthUser, setAuthUserFromLoginResponse, getAuthUser } from '@/utils/auth-session';
import type { User } from '@/interfaces';

export { getToken };

export async function login(email: string, password: string, provider?: string) {
  const authProvider = provider || getDefaultAuthProvider();

  const response = await api.post('/v1/auth/login', {
    email,
    password,
    provider: authProvider,
  });
  const token = extractAuthToken(response.data);

  if (token) {
    setToken(token);
  }
  setAuthUserFromLoginResponse(response.data);

  const storedUser = getAuthUser();
  if (storedUser?.id) {
    try {
      const fullUser = await getUser(storedUser.id);
      if (fullUser && typeof fullUser === 'object' && 'id' in fullUser) {
        setAuthUser(fullUser as User);
      }
    } catch {
      // Keep the user object from the login response
    }
  }

  return response.data;
}

export async function logout() {
  try {
    await api.post('/v1/logout');
  } catch {
    // Clear local session even if the API call fails
  }
  setToken(null);
}

/** Supports flat and Laravel-style `{ data: { access_token } }` envelopes. */
function extractAuthToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  for (const key of ['access_token', 'accessToken', 'token', 'jwt'] as const) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }

  if (record.data && typeof record.data === 'object') {
    return extractAuthToken(record.data);
  }

  return null;
}
