import { api } from '@/shared/api/http';

export type MessageResponse = {
  message: string;
};

export async function requestPasswordReset(
  email: string,
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/forgot-password', {
    email,
  });
  return data;
}

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/reset-password', {
    token: payload.token,
    newPassword: payload.newPassword,
  });
  return data;
}
