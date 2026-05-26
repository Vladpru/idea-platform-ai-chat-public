import { useChangePasswordMutation } from '@/features/profile/hooks/use-profile-mutations';
import {
  type ChangePasswordFormValues,
  changePasswordDefaultValues,
  changePasswordSchema,
  passwordMaxLengthRule,
} from '@/features/profile/lib/change-password-schema';
import { ChangePasswordField } from '@/features/profile/ui/change-password/ChangePasswordField';
import {
  cancelOutlineBtn,
  primaryBtn,
} from '@/features/profile/ui/profile-view-classes';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type ChangePasswordFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function ChangePasswordForm({
  onSuccess,
  onCancel,
}: ChangePasswordFormProps) {
  const globalErrorId = useId();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const changePasswordMutation = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: changePasswordDefaultValues,
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async values => {
    setGlobalError(null);

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password updated successfully');
      onSuccess();
    } catch (error) {
      setGlobalError(
        getApiErrorMessage(error, {
          invalidCredentialsMessage: 'Current password is incorrect',
        }),
      );
    }
  });

  const isSubmitting = changePasswordMutation.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {globalError ? (
        <p
          id={globalErrorId}
          role="alert"
          className="bg-destructive/10 text-destructive rounded-sm px-3 py-2 text-sm font-medium"
        >
          {globalError}
        </p>
      ) : null}

      <ChangePasswordField
        id="change-password-current"
        label="Current password"
        placeholder="Enter current password"
        autoComplete="current-password"
        registration={register('currentPassword', {
          maxLength: passwordMaxLengthRule,
        })}
        error={errors.currentPassword?.message}
        autoFocus
      />
      <ChangePasswordField
        id="change-password-new"
        label="New password"
        placeholder="Create new password"
        autoComplete="new-password"
        registration={register('newPassword', {
          maxLength: passwordMaxLengthRule,
        })}
        error={errors.newPassword?.message}
      />
      <ChangePasswordField
        id="change-password-confirm"
        label="Confirm password"
        placeholder="Confirm new password"
        autoComplete="new-password"
        registration={register('confirmPassword', {
          maxLength: passwordMaxLengthRule,
        })}
        error={errors.confirmPassword?.message}
      />

      <div className="mt-auto flex flex-col gap-4 pt-6 md:flex-row md:justify-between">
        <Button
          type="button"
          variant="outline"
          className={cn(cancelOutlineBtn, 'w-full md:w-auto md:min-w-47')}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className={cn(primaryBtn, 'w-full md:w-auto md:min-w-47')}
          disabled={!isValid || isSubmitting}
          isLoading={isSubmitting}
        >
          Change password
        </Button>
      </div>
    </form>
  );
}
