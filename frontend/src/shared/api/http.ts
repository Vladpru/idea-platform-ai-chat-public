import axios, { type InternalAxiosRequestConfig } from "axios";

import {
  getStoredAuthToken,
  setStoredAuthToken,
  clearStoredAuthToken,
} from "@/shared/lib/auth-token";

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL;
  if (typeof base !== "string" || base.length === 0) {
    throw new Error("VITE_API_URL is not set");
  }
  return base.replace(/\/$/, "");
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

let refreshInFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = cleanApi
      .post<RefreshResponse>("/token/refresh")
      .then(({ data }) => {
        setStoredAuthToken(data.accessToken);
        return data.accessToken;
      })
      .catch((error) => {
        clearStoredAuthToken();
        window.location.href = "/login";
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
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;

    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (status !== 401 || !original || original._retry) {
      throw error;
    }

    original._retry = true;

    await refreshAccessToken();
    return await api.request(original);
  },
);
