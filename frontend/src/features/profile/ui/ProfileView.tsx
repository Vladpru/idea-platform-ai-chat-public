import { useProfileView } from '@/features/profile/hooks/use-profile-view';
import { sectionTitleClass } from '@/features/profile/ui/profile-view-classes';
import { ProfileDisplayPanel } from '@/features/profile/ui/ProfileDisplayPanel';
import { ProfileEditPanel } from '@/features/profile/ui/ProfileEditPanel';

import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

export function ProfileView() {
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
      <div className="bg-brand-neutral dark:bg-background min-h-[64px] px-4 py-8 md:px-8">
        <Card className="text-card-foreground dark:bg-card bg-card mx-auto max-w-4xl rounded-sm p-6 md:p-10">
          <Skeleton className="mb-6 h-10 w-48" />
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-muted-foreground p-6 text-sm">
        You need to be signed in to view this page.
      </div>
    );
  }

  return (
    <div className="bg-brand-neutral dark:bg-background min-h-[64px] px-4 py-8 md:px-8">
      <Card className="text-card-foreground dark:bg-card bg-card mx-auto max-w-4xl rounded-sm p-6 md:p-10">
        <h1 className={sectionTitleClass}>My account</h1>

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
      </Card>
    </div>
  );
}
