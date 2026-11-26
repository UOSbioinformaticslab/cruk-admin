import axios, { AxiosError, AxiosInstance } from 'axios';
import { getApiBaseUrl } from '@/config/api';
import { AUTH_TOKEN_KEY } from '@/consts/storage';
import { setAuthUser } from '@/utils/auth-session';

const API_BASE_URL = getApiBaseUrl();

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });

  client.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        const url = error.config?.url ?? '';
        const method = (error.config?.method ?? 'get').toLowerCase();
        const isLoginRequest = url.includes('/auth/login');

        // Only treat GET 401 as session expiry. Mutation 401s are usually
        // permission errors — let the UI surface them without logging out.
        if (!isLoginRequest && method === 'get') {
          setToken(null);
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }

      if (!error.response && error.request) {
        let errorMessage = 'Network Error: Unable to connect to the API.';
        errorMessage += `\nAPI URL: ${API_BASE_URL}`;
        errorMessage += `\nError Code: ${error.code || 'N/A'}`;
        errorMessage += `\nPlease check:`;
        errorMessage += `\n1. Is the API running at ${API_BASE_URL}?`;
        errorMessage += `\n2. Check browser console for CORS errors`;
        errorMessage += `\n3. Try: curl ${API_BASE_URL}/v1/users`;
        return Promise.reject(new Error(errorMessage));
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const api = createClient();

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthUser(null);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}
