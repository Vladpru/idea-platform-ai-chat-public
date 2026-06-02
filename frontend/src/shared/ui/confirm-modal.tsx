import { outlineBtn } from '@/features/profile/ui/profile-view-classes';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { AppModal } from '@/shared/ui/app-modal';

export type ConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isPending?: boolean;
  confirmClassName?: string;
  cancelClassName?: string;
  reverseButtons?: boolean;
};

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onCancel,
  isPending = false,
  confirmClassName,
  cancelClassName,
  reverseButtons = false,
}: ConfirmModalProps) {
  const handleCancel = () => {
    if (isPending) return;
    onCancel?.();
    onOpenChange(false);
  };

  const confirmButton = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        outlineBtn,
        'text-brand-orange border-brand-orange hover:bg-brand-orange/10 w-full min-w-[156px] px-6 py-1 sm:w-auto md:h-11',
        confirmClassName,
      )}
      disabled={isPending}
      onClick={onConfirm}
      isLoading={isPending}
    >
      {confirmLabel}
    </Button>
  );

  const cancelButton = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        outlineBtn,
        'w-full min-w-[156px] px-6 py-1 sm:w-auto md:h-11',
        cancelClassName,
      )}
      disabled={isPending}
      onClick={handleCancel}
    >
      {cancelLabel}
    </Button>
  );

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      preventClose={isPending}
    >
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
        {reverseButtons ? (
          <>
            {cancelButton}
            {confirmButton}
          </>
        ) : (
          <>
            {confirmButton}
            {cancelButton}
          </>
        )}
      </div>
    </AppModal>
  );
}
