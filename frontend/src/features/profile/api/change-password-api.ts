import {
  changePassword,
  type ChangePasswordPayload,
} from '@/features/profile/api/profile-api';

export type ChangePasswordRequest = ChangePasswordPayload;

export async function submitChangePassword(
  payload: ChangePasswordRequest,
): Promise<void> {
  await changePassword(payload);
}
