import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';

import { api, runWithoutAuthRefresh } from '@/shared/api/http';

export type AuthDto = {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

export type AuthResponse<TUser = unknown> = {
  user: TUser;
  accessToken: string;
};

export async function login<TUser = unknown>(dto: AuthDto): Promise<TUser> {
  return runWithoutAuthRefresh(async () => {
    useAuthSessionStore.getState().clearSession();
    const { data } = await api.post<AuthResponse<TUser>>('/auth/login', dto, {
      skipAuthRefresh: true,
    });
    useAuthSessionStore.getState().setSession(data.user);
    return data.user;
  });
}

export async function register<TUser = unknown>(dto: AuthDto): Promise<TUser> {
  return runWithoutAuthRefresh(async () => {
    useAuthSessionStore.getState().clearSession();
    const { data } = await api.post<AuthResponse<TUser>>('/auth/register', dto, {
      skipAuthRefresh: true,
    });
    useAuthSessionStore.getState().setSession(data.user);
    return data.user;
  });
}

export async function loginWithGoogleAccessToken<TUser = unknown>(
  googleAccessToken: string,
): Promise<TUser> {
  return runWithoutAuthRefresh(async () => {
    useAuthSessionStore.getState().clearSession();
    const { data } = await api.post<AuthResponse<TUser>>(
      '/auth/google',
      {
        token: googleAccessToken,
      },
      { skipAuthRefresh: true },
    );
    useAuthSessionStore.getState().setSession(data.user);
    return data.user;
  });
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    useAuthSessionStore.getState().clearSession();
  }
}
