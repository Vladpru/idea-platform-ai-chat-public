import { changePasswordSchema } from '@/features/profile/lib/change-password-schema';
import {
  cancelOutlineBtn,
  labelClass,
  primaryBtn,
} from '@/features/profile/ui/profile-view-classes';
import { Eye, EyeOff, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type PasswordFields = Partial<
  Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>
>;

type ChangePasswordModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void> | void;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  error?: string;
  autoFocus?: boolean;
};

function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  value,
  onChange,
  visible,
  onVisibleChange,
  error,
  autoFocus,
}: PasswordFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className={cn(labelClass, 'text-brand-gray-600')}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus={autoFocus}
          className="rounded-sm bg-transparent py-2.5 pr-10"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="text-brand-gray-400 hover:text-foreground absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2"
          onClick={() => onVisibleChange(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ChangePasswordModal({
  open,
  onOpenChange,
  onSubmit,
}: ChangePasswordModalProps) {
  const titleId = useId();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PasswordFields>({});

  useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setFieldErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const errors: PasswordFields = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'currentPassword' ||
          key === 'newPassword' ||
          key === 'confirmPassword'
        ) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      setIsSubmitting(true);
      await onSubmit({ currentPassword, newPassword });
      toast.success('Password updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formIncomplete =
    !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim();

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

          <form
            onSubmit={handleSubmit}
            aria-labelledby={titleId}
            className="space-y-4"
            noValidate
          >
            <PasswordField
              id="current-password"
              label="Current password"
              placeholder="Enter current password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={v => {
                setCurrentPassword(v);
                if (fieldErrors.currentPassword) {
                  setFieldErrors(prev => {
                    const next = { ...prev };
                    delete next.currentPassword;
                    return next;
                  });
                }
              }}
              visible={showCurrent}
              onVisibleChange={setShowCurrent}
              error={fieldErrors.currentPassword}
              autoFocus
            />
            <PasswordField
              id="new-password"
              label="New password"
              placeholder="Create new password"
              autoComplete="new-password"
              value={newPassword}
              onChange={v => {
                setNewPassword(v);
                if (fieldErrors.newPassword) {
                  setFieldErrors(prev => {
                    const next = { ...prev };
                    delete next.newPassword;
                    return next;
                  });
                }
              }}
              visible={showNew}
              onVisibleChange={setShowNew}
              error={fieldErrors.newPassword}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm password"
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={v => {
                setConfirmPassword(v);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors(prev => {
                    const next = { ...prev };
                    delete next.confirmPassword;
                    return next;
                  });
                }
              }}
              visible={showConfirm}
              onVisibleChange={setShowConfirm}
              error={fieldErrors.confirmPassword}
            />

            <div className="mt-auto flex flex-col gap-4 pt-6 md:flex-row md:justify-between">
              <Button
                type="button"
                variant="outline"
                className={cn(cancelOutlineBtn, 'w-full md:w-auto md:min-w-47')}
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={cn(primaryBtn, 'w-full md:w-auto md:min-w-47')}
                disabled={formIncomplete || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Change password'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}