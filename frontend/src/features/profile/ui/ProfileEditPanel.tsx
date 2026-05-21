import { type SessionUser, nameInitial } from '@/features/auth';
import type { ProfileEditValues } from '@/features/profile/lib/profile-edit-schema';
import {
  labelClass,
  outlineBtn,
  primaryBtn,
} from '@/features/profile/ui/profile-view-classes';
import { useState } from 'react';
import type { BaseSyntheticEvent, ChangeEventHandler, RefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type ProfileEditPanelProps = {
  user: SessionUser;
  displayName: string;
  form: UseFormReturn<ProfileEditValues>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPickAvatar: ChangeEventHandler<HTMLInputElement>;
  openFilePicker: () => void;
  onSaveEdit: (e?: BaseSyntheticEvent) => Promise<void>;
  onCancelEdit: () => void;
  onRemoveAvatar: () => void | Promise<void>;
  busy: boolean;
  patchPending: boolean;
  uploadPending: boolean;
  removePending: boolean;
};

export function ProfileEditPanel({
  user,
  displayName,
  form,
  fileInputRef,
  onPickAvatar,
  openFilePicker,
  onSaveEdit,
  onCancelEdit,
  onRemoveAvatar,
  busy,
  patchPending,
  uploadPending,
  removePending,
}: ProfileEditPanelProps) {
  const [removeAvatarOpen, setRemoveAvatarOpen] = useState(false);

  const handleConfirmRemoveAvatar = async () => {
    try {
      await onRemoveAvatar();
      setRemoveAvatarOpen(false);
    } catch {
      // Error toast is handled by the mutation; keep the modal open.
    }
  };

  return (
    <div className="mt-8 space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <Avatar
          key={user.picture ?? 'no-avatar'}
          size="xl"
          className="size-24 shrink-0"
        >
          <AvatarImage src={user.picture ?? undefined} alt="" />
          <AvatarFallback className="text-4xl font-semibold">
            {nameInitial(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className={labelClass}>Profile photo</p>
          <p className="text-brand-gray-600 dark:text-muted-foreground text-sm">
            JPG, GIF or PNG. Max size 800K.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="sr-only"
            onChange={onPickAvatar}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className={primaryBtn}
              onClick={openFilePicker}
              disabled={busy}
              isLoading={uploadPending}
            >
              Upload new
            </Button>
            <Button
              type="button"
              variant="outline"
              className={outlineBtn}
              onClick={() => setRemoveAvatarOpen(true)}
              disabled={busy || !user.picture}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={removeAvatarOpen}
        onOpenChange={setRemoveAvatarOpen}
        title="Remove profile photo?"
        description="Your photo will be removed from your account. You can upload a new one anytime."
        confirmLabel="YES"
        cancelLabel="NO"
        onConfirm={handleConfirmRemoveAvatar}
        isPending={removePending}
      />

      <form className="space-y-6" onSubmit={onSaveEdit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="profile-first-name" className={labelClass}>
              First name
            </Label>
            <Input
              id="profile-first-name"
              autoComplete="given-name"
              className="rounded-sm"
              disabled={patchPending}
              {...form.register('firstName')}
            />
            {form.formState.errors.firstName && (
              <p className="text-destructive text-xs font-medium">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="profile-last-name" className={labelClass}>
              Last name
            </Label>
            <Input
              id="profile-last-name"
              autoComplete="family-name"
              className="rounded-sm"
              disabled={patchPending}
              {...form.register('lastName')}
            />
            {form.formState.errors.lastName && (
              <p className="text-destructive text-xs font-medium">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <Label htmlFor="profile-email" className={labelClass}>
            Email
          </Label>
          <Input
            id="profile-email"
            type="email"
            value={user.email}
            readOnly
            disabled
            tabIndex={-1}
            className="bg-brand-gray-100 dark:bg-muted rounded-sm opacity-90"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className={cn(outlineBtn, 'w-40')}
            disabled={patchPending}
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={cn(primaryBtn, 'w-40')}
            disabled={patchPending}
            isLoading={patchPending}
          >
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
