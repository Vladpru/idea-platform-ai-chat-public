import { useProfileView } from '@/features/profile/hooks/use-profile-view';
import { ProfileDisplayPanel } from '@/features/profile/ui/account/ProfileDisplayPanel';
import { ProfileEditPanel } from '@/features/profile/ui/account/ProfileEditPanel';
import { Skeleton } from '@/shared/ui/skeleton';

export function SettingsAccountSection() {
  const {
    user,
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
  } = useProfileView();

  if (isProfileLoading && !user) {
    return (
      <section>
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="mb-6 h-4 w-72" />
        <Skeleton className="h-32 w-full max-w-xl" />
      </section>
    );
  }

  if (!user) {
    return (
      <p className="text-muted-foreground text-sm">
        You need to be signed in to manage your account.
      </p>
    );
  }

  return (
    <section>
      <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
        Account
      </h2>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
        Update your profile photo, name, bio, social links, and password.
      </p>

      <div className="mt-6">
        {!isEditing ? (
          <ProfileDisplayPanel
            user={user}
            displayName={displayName}
            onEdit={() => setIsEditing(true)}
          />
        ) : (
          <ProfileEditPanel
            user={user}
            displayName={displayName}
            form={form}
            fileInputRef={fileInputRef}
            onPickAvatar={onPickAvatar}
            openFilePicker={openFilePicker}
            onSaveEdit={onSaveEdit}
            onCancelEdit={cancelEdit}
            onRemoveAvatar={async () => {
              await removeMutation.mutateAsync();
            }}
            busy={busy}
            patchPending={patchMutation.isPending}
            uploadPending={uploadMutation.isPending}
            removePending={removeMutation.isPending}
          />
        )}
      </div>
    </section>
  );
}
