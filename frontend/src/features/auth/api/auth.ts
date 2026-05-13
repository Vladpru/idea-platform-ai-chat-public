import { api } from "@/shared/api/http";
import {
  clearStoredAuthToken,
  setStoredAuthToken,
} from "@/shared/lib/auth-token";

export type AuthDto = {
  email: string;
  password?: string;
  realName?: string;
};

export type AuthResponse<TUser = unknown> = {
  user: TUser;
  accessToken: string;
};

export async function login<TUser = unknown>(dto: AuthDto): Promise<TUser> {
  const { data } = await api.post<AuthResponse<TUser>>("/auth/login", dto);
  setStoredAuthToken(data.accessToken);
  return data.user;
}

export async function register<TUser = unknown>(dto: AuthDto): Promise<TUser> {
  const { data } = await api.post<AuthResponse<TUser>>("/auth/register", dto);
  setStoredAuthToken(data.accessToken);
  return data.user;
}

export async function loginWithGoogleAccessToken<TUser = unknown>(
  googleAccessToken: string,
): Promise<TUser> {
  const { data } = await api.post<AuthResponse<TUser>>("/auth/google", {
    token: googleAccessToken,
  });
  setStoredAuthToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    clearStoredAuthToken();
  }
}
