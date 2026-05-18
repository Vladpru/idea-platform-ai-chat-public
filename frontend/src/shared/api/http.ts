import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import axios, { type InternalAxiosRequestConfig } from 'axios';

import { getStoredAuthToken } from '@/shared/lib/auth-token';

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL;
  if (typeof base !== 'string' || base.length === 0) {
    throw new Error('VITE_API_URL is not set');
  }
  return base.replace(/\/$/, '');
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

const cleanApi = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type RefreshResponse = { accessToken: string };

const AUTH_ROUTES_SKIP_REFRESH =
  /^\/auth\/(login|register|google|forgot-password|reset-password)(\/|$)/;

function isPublicAuthPage(): boolean {
  const path = window.location.pathname;
  return (
    path === '/login' ||
    path === '/register' ||
    path === '/forgotPassword' ||
    path.startsWith('/reset-password')
  );
}

function shouldSkipAuthRefresh(
  config: InternalAxiosRequestConfig & { skipAuthRefresh?: boolean },
): boolean {
  if (config.skipAuthRefresh) return true;
  const url = config.url ?? '';
  return AUTH_ROUTES_SKIP_REFRESH.test(url);
}

let refreshInFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = cleanApi
      .post<RefreshResponse>('/token/refresh')
      .then(({ data }) => {
        useAuthSessionStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(error => {
        useAuthSessionStore.getState().clearSession();
        if (!isPublicAuthPage()) {
          window.location.assign('/login');
        }
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export function isAxiosUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

api.interceptors.response.use(
  response => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;

    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & {
          _retry?: boolean;
          skipAuthRefresh?: boolean;
        })
      | undefined;

    if (
      status !== 401 ||
      !original ||
      original._retry ||
      shouldSkipAuthRefresh(original)
    ) {
      throw error;
    }

    original._retry = true;

    await refreshAccessToken();
    return await api.request(original);
  },
);
