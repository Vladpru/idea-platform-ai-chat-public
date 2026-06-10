import { nameInitial } from '@/features/auth';
import type { UserPublic } from '@/features/profile/api/profile.api';
import type { ProfileEditValues } from '@/features/profile/lib/profile-edit-schema';
import {
  labelClass,
  outlineBtn,
  primaryBtn,
} from '@/features/profile/ui/shared/profile-view-classes';
import { textareaClass } from '@/features/ideas/lib/styles/idea-creation';
import { Plus, Trash2 } from 'lucide-react';
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
  user: UserPublic;
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
  const socialLinks = form.watch('socialLinks');
  const bioValue = form.watch('bio') || '';

  const addSocialLink = () => {
    if (socialLinks.length >= 10) return;
    form.setValue('socialLinks', [...socialLinks, ''], { shouldDirty: true });
  };

  const removeSocialLink = (index: number) => {
    if (socialLinks.length <= 1) return;
    form.setValue(
      'socialLinks',
      socialLinks.filter((_, currentIndex) => currentIndex !== index),
      { shouldDirty: true },
    );
  };

  const handleConfirmRemoveAvatar = async () => {
    try {
      await onRemoveAvatar();
      setRemoveAvatarOpen(false);
    } catch {
      return;
    }
  };

  return (
    <div className="mt-8 space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <Avatar
          key={user.avatarUrl ?? 'no-avatar'}
          size="xl"
          className="size-24 shrink-0"
        >
          <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
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
              className={cn(primaryBtn, 'cursor-pointer')}
              onClick={openFilePicker}
              disabled={busy}
              isLoading={uploadPending}
            >
              Upload new
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(outlineBtn, 'cursor-pointer')}
              onClick={() => setRemoveAvatarOpen(true)}
              disabled={busy || !user.avatarUrl}
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

        <div className="flex flex-col gap-1">
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

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="profile-bio" className={labelClass}>
              Bio
            </Label>
            <span className="text-brand-gray-500 text-xs tabular-nums">
              {bioValue.length}/300
            </span>
          </div>
          <textarea
            id="profile-bio"
            rows={4}
            maxLength={300}
            disabled={patchPending}
            aria-describedby="profile-bio-hint"
            className={cn(textareaClass, 'min-h-[120px] rounded-sm')}
            {...form.register('bio')}
          />
          <p
            id="profile-bio-hint"
            className="text-brand-gray-600 dark:text-muted-foreground text-xs"
          >
            A short introduction shown on your public profile.
          </p>
          {form.formState.errors.bio && (
            <p className="text-destructive text-xs font-medium">
              {form.formState.errors.bio.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className={labelClass}>Social links</Label>
            <Button
              type="button"
              variant="outline"
              className={cn(outlineBtn, 'h-9 cursor-pointer px-3')}
              disabled={patchPending || socialLinks.length >= 10}
              onClick={addSocialLink}
            >
              <Plus className="mr-1 size-4" />
              Add link
            </Button>
          </div>

          <div className="space-y-3">
            {socialLinks.map((_, index) => (
              <div
                key={`social-link-${index}`}
                className="flex items-start gap-2"
              >
                <div className="min-w-0 flex-1">
                  <Input
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://"
                    className="rounded-sm"
                    disabled={patchPending}
                    aria-label={`Social link ${index + 1}`}
                    {...form.register(`socialLinks.${index}` as const)}
                  />
                  {form.formState.errors.socialLinks?.[index] && (
                    <p className="text-destructive mt-1 text-xs font-medium">
                      {form.formState.errors.socialLinks[index]?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    outlineBtn,
                    'h-10 shrink-0 cursor-pointer px-3',
                  )}
                  disabled={patchPending || socialLinks.length <= 1}
                  aria-label={`Remove social link ${index + 1}`}
                  onClick={() => removeSocialLink(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className={cn(outlineBtn, 'w-40 cursor-pointer')}
            disabled={patchPending}
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={cn(primaryBtn, 'w-40 cursor-pointer')}
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
