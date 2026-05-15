import { useAuthSessionStore } from '@/features/auth';
import {
  usePatchUserMutation,
  useRemoveAvatarMutation,
  useUploadAvatarMutation,
} from '@/features/profile/hooks/use-profile-mutations';
import {
  AVATAR_MAX_BYTES,
  type ProfileEditValues,
  profileEditSchema,
} from '@/features/profile/lib/profile-edit-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function useProfileView() {
  const user = useAuthSessionStore(s => s.user);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patchMutation = usePatchUserMutation(user?.id);
  const uploadMutation = useUploadAvatarMutation();
  const removeMutation = useRemoveAvatarMutation();

  const form = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  useEffect(() => {
    if (!isEditing || !user) return;
    form.reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    });
  }, [isEditing, user, form]);

  const displayName =
    user &&
    (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
      user.email.split('@')[0] ||
      'User');

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
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  });

  const cancelEdit = () => {
    if (!user) return;
    setIsEditing(false);
    form.reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    });
  };

  const busy =
    patchMutation.isPending ||
    uploadMutation.isPending ||
    removeMutation.isPending;

  return {
    user,
    isEditing,
    setIsEditing,
    displayName: displayName ?? '',
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
