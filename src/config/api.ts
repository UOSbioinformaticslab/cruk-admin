export const DEFAULT_API_URL = 'http://localhost:8100/api';

/** Browser calls go through the Next.js proxy. Server calls hit the API directly. */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

export function getPublicApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

export function getDefaultAuthProvider() {
  return process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'cruk';
}
