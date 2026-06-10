import { useAuthSessionStore } from '@/features/auth';
import {
  usePatchUserMutation,
  useRemoveAvatarMutation,
  useUploadAvatarMutation,
} from '@/features/profile/hooks/use-profile-mutations';
import {
  AVATAR_MAX_BYTES,
  normalizeSocialLinksForForm,
  normalizeSocialLinksForSubmit,
  type ProfileEditValues,
  profileEditSchema,
} from '@/features/profile/lib/profile-edit-schema';
import { useCurrentUserQuery } from '@/features/settings/hooks/use-notification-preferences';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { formatUserDisplayName } from '@/shared/lib/user-display';

function buildProfileEditDefaults(user: {
  firstName: string | null;
  lastName: string | null;
  bio?: string | null;
  socialLinks?: string[];
}): ProfileEditValues {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    bio: user.bio ?? '',
    socialLinks: normalizeSocialLinksForForm(user.socialLinks),
  };
}

export function useProfileView() {
  const sessionUser = useAuthSessionStore(s => s.user);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profileUser, isLoading: isProfileLoading } =
    useCurrentUserQuery({
      enabled: Boolean(sessionUser?.id),
    });

  const user = profileUser ?? null;

  const patchMutation = usePatchUserMutation();
  const uploadMutation = useUploadAvatarMutation();
  const removeMutation = useRemoveAvatarMutation();

  const form = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: buildProfileEditDefaults({
      firstName: '',
      lastName: '',
      bio: '',
      socialLinks: [],
    }),
  });

  useEffect(() => {
    if (!user || isEditing) return;
    form.reset(buildProfileEditDefaults(user));
  }, [user, form, isEditing]);

  const displayName = user
    ? formatUserDisplayName({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
    : (sessionUser?.name ?? '');

  const openFilePicker = () => fileInputRef.current?.click();

  const onPickAvatar: ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/i)) {
      toast.error('Use JPG, PNG, or GIF.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('File must be 800K or smaller.');
      return;
    }
    uploadMutation.mutate(file);
  };

  const onSaveEdit = form.handleSubmit(values => {
    patchMutation.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        bio: values.bio.trim() || null,
        socialLinks: normalizeSocialLinksForSubmit(values.socialLinks),
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  });

  const cancelEdit = () => {
    if (!user) return;
    setIsEditing(false);
    form.reset(buildProfileEditDefaults(user));
  };

  const busy =
    patchMutation.isPending ||
    uploadMutation.isPending ||
    removeMutation.isPending;

  return {
    user,
    sessionUser,
    isProfileLoading,
    isEditing,
    setIsEditing,
    displayName,
    fileInputRef,
    form,
    openFilePicker,
    onPickAvatar,
    onSaveEdit,
    cancelEdit,
    patchMutation,
    uploadMutation,
    removeMutation,
    busy,
  };
}
