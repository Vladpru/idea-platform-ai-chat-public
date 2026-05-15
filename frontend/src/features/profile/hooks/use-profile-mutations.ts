import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';

import {
  changePassword,
  patchUser,
  removeMyAvatar,
  uploadMyAvatar,
  type ChangePasswordPayload,
  type PatchUserPayload,
  type UserPublic,
} from '../api/profile-api';

function applyUserToSession(user: UserPublic) {
  const accessToken = useAuthSessionStore.getState().accessToken;
  if (!accessToken) return;
  useAuthSessionStore.getState().setSession(user, accessToken);
}

export function usePatchUserMutation(userId: string | undefined) {
  return useMutation({
    mutationFn: (payload: PatchUserPayload) => {
      if (!userId) throw new Error('Missing user id');
      return patchUser(userId, payload);
    },
    onSuccess: user => {
      applyUserToSession(user);
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Could not update profile');
    },
  });
}

export function useUploadAvatarMutation() {
  return useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file),
    onSuccess: user => {
      applyUserToSession(user);
      toast.success('Photo updated');
    },
    onError: () => {
      toast.error('Upload failed');
    },
  });
}

export function useRemoveAvatarMutation() {
  return useMutation({
    mutationFn: () => removeMyAvatar(),
    onSuccess: user => {
      applyUserToSession(user);
      toast.success('Photo removed');
    },
    onError: () => {
      toast.error('Could not remove photo');
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  });
}
