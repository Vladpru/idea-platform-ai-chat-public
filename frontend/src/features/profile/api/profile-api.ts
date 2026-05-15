import { api } from '@/shared/api/http';

/** Matches backend `UserPublic` (JSON dates). */
export type UserPublic = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PatchUserPayload = {
  firstName: string;
  lastName: string;
};

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

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await api.patch('/users/me/password', payload);
}
