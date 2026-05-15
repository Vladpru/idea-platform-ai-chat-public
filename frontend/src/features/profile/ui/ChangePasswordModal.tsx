import { ChangePasswordForm } from '@/features/profile/ui/change-password/ChangePasswordForm';
import { X } from 'lucide-react';
import { useId } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

type ChangePasswordModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const titleId = useId();

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'border-0 bg-white p-0 shadow-xl',
          'max-md:fixed max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:max-h-[calc(100dvh-1rem)] max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-lg max-md:rounded-b-none',
          'md:h-[464px] md:max-w-2xl md:p-6',
        )}
      >
        <div className="relative flex h-full flex-col p-6 pb-6 md:px-8 md:pt-0 md:pb-0">
          <button
            type="button"
            className="text-brand-dark-blue hover:bg-muted focus-visible:ring-ring absolute top-3 right-3 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent transition-colors hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 md:top-0 md:right-0"
            aria-label="Close"
            onClick={handleClose}
          >
            <X className="h-5.85 w-5.85" aria-hidden />
          </button>

          <DialogHeader className="mb-6 space-y-0">
            <DialogTitle
              id={titleId}
              className="text-brand-gray-900 text-center text-xl font-bold md:text-left"
            >
              Change password
            </DialogTitle>
          </DialogHeader>

          <ChangePasswordForm
            open={open}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
