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
  timeout: 15_000,
});

const cleanApi = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 15_000,
});

const AUTH_ROUTE_PATH =
  /^\/auth\/(login|register|google|forgot-password|reset-password)(\/|$|\?)/;

function getRequestPath(config: InternalAxiosRequestConfig): string {
  const raw = config.url ?? '';
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function isAuthRouteRequest(
  config: InternalAxiosRequestConfig & { skipAuthRefresh?: boolean },
): boolean {
  return AUTH_ROUTE_PATH.test(getRequestPath(config));
}

let authRefreshSuppressed = 0;

export function runWithoutAuthRefresh<T>(fn: () => Promise<T>): Promise<T> {
  authRefreshSuppressed += 1;
  return fn().finally(() => {
    authRefreshSuppressed -= 1;
  });
}

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
  return (
    authRefreshSuppressed > 0 ||
    Boolean(config.skipAuthRefresh) ||
    isAuthRouteRequest(config)
  );
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!isAuthRouteRequest(config)) {
    const token = getStoredAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export type RefreshResponse = { accessToken: string };

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

    try {
      await refreshAccessToken();
      return await api.request(original);
    } catch {
      throw error;
    }
  },
);
