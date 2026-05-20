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
}: ConfirmModalProps) {
  const handleCancel = () => {
    if (isPending) {
      return;
    }
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      preventClose={isPending}
    >
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <Button
          type="button"
          variant="outline"
          className={cn(outlineBtn, 'w-full sm:w-auto')}
          disabled={isPending}
          onClick={onConfirm}
          isLoading={isPending}
        >
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(outlineBtn, 'w-full sm:w-auto')}
          disabled={isPending}
          onClick={handleCancel}
        >
          {cancelLabel}
        </Button>
      </div>
    </AppModal>
  );
}
