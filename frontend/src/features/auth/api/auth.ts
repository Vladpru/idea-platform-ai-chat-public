import { api } from "@/shared/api/http";
import { useAuthSessionStore } from "@/features/auth/model/auth-session-store";

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
  useAuthSessionStore.getState().setSession(data.user, data.accessToken);
  return data.user;
}

export async function register<TUser = unknown>(dto: AuthDto): Promise<TUser> {
  const { data } = await api.post<AuthResponse<TUser>>("/auth/register", dto);
  useAuthSessionStore.getState().setSession(data.user, data.accessToken);
  return data.user;
}

export async function loginWithGoogleAccessToken<TUser = unknown>(
  googleAccessToken: string,
): Promise<TUser> {
  const { data } = await api.post<AuthResponse<TUser>>("/auth/google", {
    token: googleAccessToken,
  });
  useAuthSessionStore.getState().setSession(data.user, data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    useAuthSessionStore.getState().clearSession();
  }
}
