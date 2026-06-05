import { api } from '@/shared/api/http';

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

/** Matches backend `UserPublic` (JSON dates). */
export type UserPublic = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  themePreference: ThemePreference;
  createdAt: string;
  updatedAt: string;
};

export type UpdateThemePayload = {
  theme: ThemePreference;
};

export type PatchUserPayload = {
  firstName: string;
  lastName: string;
};

export async function fetchCurrentUser(): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>('/users/me');
  return data;
}

export async function patchTheme(
  payload: UpdateThemePayload,
): Promise<UserPublic> {
  const { data } = await api.patch<UserPublic>('/users/me/theme', payload);
  return data;
}

export async function patchUser(
  userId: string,
  payload: PatchUserPayload,
): Promise<UserPublic> {
  const { data } = await api.patch<UserPublic>(`/users/${userId}`, payload);
  return data;
}

export async function uploadMyAvatar(file: File): Promise<UserPublic> {
  const body = new FormData();
  body.append('file', file);
  const { data } = await api.post<UserPublic>('/users/me/avatar', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function removeMyAvatar(): Promise<UserPublic> {
  const { data } = await api.delete<UserPublic>('/users/me/avatar');
  return data;
}

export type HasPasswordResponse = {
  hasPassword: boolean;
};

export async function fetchHasPassword(): Promise<boolean> {
  const { data } = await api.get<HasPasswordResponse>('/users/me/has-password');
  return data.hasPassword;
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> {
  const { data } = await api.patch<ChangePasswordResponse>(
    '/users/me/password',
    payload,
    { skipAuthRefresh: true },
  );
  return data;
}
