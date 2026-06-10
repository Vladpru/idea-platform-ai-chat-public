import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { currentUserQueryKey } from '@/features/settings/hooks/use-notification-preferences';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { submitChangePassword } from '../api/change-password-api';
import {
  type ChangePasswordPayload,
  type PatchUserPayload,
  type UserPublic,
  patchUser,
  removeMyAvatar,
  uploadMyAvatar,
} from '../api/profile.api';

function applyUserToSession(user: UserPublic) {
  const accessToken = useAuthSessionStore.getState().accessToken;
  if (!accessToken) return;
  useAuthSessionStore.getState().setSession(user, accessToken);
}

export function usePatchUserMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatchUserPayload) => {
      if (!userId) throw new Error('Missing user id');
      return patchUser(userId, payload);
    },
    onSuccess: user => {
      applyUserToSession(user);
      queryClient.setQueryData(currentUserQueryKey, user);
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Could not update profile');
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file),
    onSuccess: user => {
      applyUserToSession(user);
      queryClient.setQueryData(currentUserQueryKey, user);
      toast.success('Photo updated');
    },
    onError: () => {
      toast.error('Upload failed');
    },
  });
}

export function useRemoveAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeMyAvatar(),
    onSuccess: user => {
      applyUserToSession(user);
      queryClient.setQueryData(currentUserQueryKey, user);
      toast.success('Photo removed');
    },
    onError: () => {
      toast.error('Could not remove photo');
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      submitChangePassword(payload),
  });
}
