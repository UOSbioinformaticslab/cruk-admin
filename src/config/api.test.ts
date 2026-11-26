import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_API_URL, getApiBaseUrl, getDefaultAuthProvider, getPublicApiUrl } from './api';

describe('api config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the Next proxy in the browser', () => {
    expect(getApiBaseUrl()).toBe('/api/proxy');
  });

  it('reads the public API URL and auth provider from the environment', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.test/api');
    vi.stubEnv('NEXT_PUBLIC_AUTH_PROVIDER', 'service');

    expect(getPublicApiUrl()).toBe('https://api.example.test/api');
    expect(getDefaultAuthProvider()).toBe('service');
  });

  it('falls back when those variables are empty', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    vi.stubEnv('NEXT_PUBLIC_AUTH_PROVIDER', '');

    expect(getPublicApiUrl()).toBe(DEFAULT_API_URL);
    expect(getDefaultAuthProvider()).toBe('cruk');
  });
});
