import { primaryBtn } from '@/features/profile/ui/profile-view-classes';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { AppModal } from '@/shared/ui/app-modal';

export type SuccessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  buttonLabel?: string;
  onClose: () => void;
};

export function SuccessModal({
  open,
  onOpenChange,
  title,
  description,
  buttonLabel = 'OK',
  onClose,
}: SuccessModalProps) {
  const handleClose = () => {
    onClose();
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) {
          handleClose();
          return;
        }
        onOpenChange(nextOpen);
      }}
      title={title}
      description={description}
    >
      <div className="mt-8 flex justify-center">
        <Button
          type="button"
          className={cn(primaryBtn, 'min-w-[120px]')}
          onClick={handleClose}
        >
          {buttonLabel}
        </Button>
      </div>
    </AppModal>
  );
}
