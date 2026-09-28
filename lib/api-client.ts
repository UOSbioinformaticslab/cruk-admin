import axios, { AxiosInstance, AxiosError } from 'axios';
import { setAuthUser, setAuthUserFromLoginResponse, getAuthUser } from './auth-session';
import { unwrapEntity } from './api-response';
import type { User } from './types';

// Use Next.js API proxy in browser to avoid CORS issues
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser, use Next.js API proxy
    return '/api/proxy';
  }
  // On server, use direct API URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false, // Set to false to avoid CORS issues
    });

    // Initialize token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const url = error.config?.url ?? '';
          const method = (error.config?.method ?? 'get').toLowerCase();
          const isLoginRequest = url.includes('/auth/login');

          // Only treat GET 401 as session expiry. Mutation 401s are usually
          // permission errors — let the UI surface them without logging out.
          if (!isLoginRequest && method === 'get') {
            this.setToken(null);
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
        // Enhance error message for network errors
        if (!error.response && error.request) {
          let errorMessage = 'Network Error: Unable to connect to the API.';
          errorMessage += `\nAPI URL: ${API_BASE_URL}`;
          errorMessage += `\nError Code: ${error.code || 'N/A'}`;
          errorMessage += `\nPlease check:`;
          errorMessage += `\n1. Is the API running at ${API_BASE_URL}?`;
          errorMessage += `\n2. Check browser console for CORS errors`;
          errorMessage += `\n3. Try: curl ${API_BASE_URL}/v1/users`;
          const networkError = new Error(errorMessage);
          return Promise.reject(networkError);
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      setAuthUser(null);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return this.token;
  }

  // Users API
  async getUsers(params?: { page?: number; per_page?: number; filterNames?: string; filter_names?: string }) {
    const { filterNames, ...rest } = params ?? {};
    const response = await this.client.get('/v1/users', {
      params: {
        ...rest,
        // API expects snake_case
        ...(filterNames ? { filter_names: filterNames } : {}),
      },
    });
    return response.data;
  }

  async getUser(id: number) {
    const response = await this.client.get(`/v1/users/${id}`);
    return unwrapEntity<User>(response.data) ?? response.data;
  }

  async createUser(data: any) {
    const response = await this.client.post('/v1/users', data);
    return response.data;
  }

  async updateUser(id: number, data: any) {
    const response = await this.client.put(`/v1/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number) {
    const response = await this.client.delete(`/v1/users/${id}`);
    return response.data;
  }

  async assignUserRoles(userId: number, roles: string[]) {
    const response = await this.client.post(`/v1/users/${userId}/roles`, { roles });
    return response.data;
  }

  async updateUserRoles(userId: number, roles: Record<string, boolean>) {
    const response = await this.client.patch(`/v1/users/${userId}/roles`, { roles });
    return response.data;
  }

  async addUserToTeam(teamId: number, userId: number, roles: string[]) {
    const response = await this.client.post(`/v1/teams/${teamId}/users`, {
      userId: Number(userId),
      roles,
    });
    return response.data;
  }

  async removeUserFromTeam(teamId: number, userId: number) {
    const response = await this.client.delete(`/v1/teams/${teamId}/users/${userId}`);
    return response.data;
  }

  // Teams API
  async getTeams(params?: { page?: number; per_page?: number; sort?: string }) {
    const response = await this.client.get('/v1/teams', { params });
    return response.data;
  }

  async getTeam(id: number) {
    const response = await this.client.get(`/v1/teams/${id}`);
    return response.data;
  }

  async createTeam(data: any) {
    const response = await this.client.post('/v1/teams', data);
    return response.data;
  }

  async updateTeam(id: number, data: any) {
    const response = await this.client.put(`/v1/teams/${id}`, data);
    return response.data;
  }

  async deleteTeam(id: number) {
    const response = await this.client.delete(`/v1/teams/${id}`);
    return response.data;
  }

  // Roles API
  async getRoles(params?: { page?: number; per_page?: number }) {
    const response = await this.client.get('/v1/roles', { params });
    return response.data;
  }

  async getRole(id: number) {
    const response = await this.client.get(`/v1/roles/${id}`);
    return response.data;
  }

  async createRole(data: any) {
    const response = await this.client.post('/v1/roles', data);
    return response.data;
  }

  async updateRole(id: number, data: any) {
    const response = await this.client.put(`/v1/roles/${id}`, data);
    return response.data;
  }

  async deleteRole(id: number) {
    const response = await this.client.delete(`/v1/roles/${id}`);
    return response.data;
  }

  // Cancer Type Filters API
  async getCancerTypeFilters(params?: { parent_id?: number; level?: number }) {
    const response = await this.client.get('/v1/cancer-type-filters', { params });
    return response.data;
  }

  async getCancerTypeFilter(id: number) {
    const response = await this.client.get(`/v1/cancer-type-filters/${id}`);
    return response.data;
  }

  async createCancerTypeFilter(data: Record<string, unknown>) {
    const response = await this.client.post('/v1/cancer-type-filters', data);
    return response.data;
  }

  async updateCancerTypeFilter(id: number, data: Record<string, unknown>) {
    const response = await this.client.put(`/v1/cancer-type-filters/${id}`, data);
    return response.data;
  }

  // Auth API
  async login(email: string, password: string, provider?: string) {
    const authProvider =
      provider || process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'cruk';

    const response = await this.client.post('/v1/auth/login', {
      email,
      password,
      provider: authProvider,
    });
    const token = this.extractAuthToken(response.data);

    if (token) {
      this.setToken(token);
    }
    setAuthUserFromLoginResponse(response.data);

    const storedUser = getAuthUser();
    if (storedUser?.id) {
      try {
        const fullUser = await this.getUser(storedUser.id);
        if (fullUser && typeof fullUser === 'object' && 'id' in fullUser) {
          setAuthUser(fullUser as User);
        }
      } catch {
        // Keep the user object from the login response
      }
    }

    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/v1/logout');
    } catch {
      // Clear local session even if the API call fails
    }
    this.setToken(null);
  }

  /** Supports flat and Laravel-style `{ data: { access_token } }` envelopes. */
  private extractAuthToken(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') return null;

    const record = payload as Record<string, unknown>;
    for (const key of ['access_token', 'accessToken', 'token', 'jwt'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }

    if (record.data && typeof record.data === 'object') {
      return this.extractAuthToken(record.data);
    }

    return null;
  }
}

export const apiClient = new ApiClient();

