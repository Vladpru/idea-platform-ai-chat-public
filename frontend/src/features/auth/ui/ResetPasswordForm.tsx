import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { Route as ResetPasswordRoute } from '@/routes/reset-password';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { Button } from '@/shared/ui';

import { resetPassword } from '../api/password-reset-api';
import {
  type ResetPasswordValues,
  resetPasswordSchema,
} from '../model/reset-password-schema';
import { PasswordInput } from './PasswordInput';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsVisible, setPasswordsVisible] = useState(false);

  const { token: rawToken } = ResetPasswordRoute.useSearch();
  const token = rawToken?.trim();
  const hasToken = Boolean(token);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const result = await resetPassword({
        token,
        newPassword: data.newPassword,
      });
      toast.success(result.message);
      await navigate({ to: '/login', replace: true });
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, {
          invalidCredentialsMessage:
            'Failed to reset password. Token might be expired.',
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {!hasToken && (
          <p
            role="alert"
            aria-live="polite"
            className="text-destructive bg-destructive/10 rounded-md p-3 text-sm font-medium"
          >
            Invalid or missing token. Please request a new password reset link.
          </p>
        )}

        <fieldset
          disabled={!hasToken || isLoading}
          className="space-y-5 border-0 p-0 disabled:opacity-60"
        >
          <PasswordInput
            id="reset-password-new"
            label="NEW PASSWORD"
            placeholder="Create new password"
            autoComplete="new-password"
            registration={register('newPassword')}
            error={errors.newPassword?.message}
            passwordVisible={passwordsVisible}
            onPasswordVisibleChange={setPasswordsVisible}
          />

          <PasswordInput
            id="reset-password-confirm"
            label="CONFIRM PASSWORD"
            placeholder="Confirm new password"
            autoComplete="new-password"
            registration={register('confirmPassword')}
            error={errors.confirmPassword?.message}
            passwordVisible={passwordsVisible}
            onPasswordVisibleChange={setPasswordsVisible}
          />

          <Button
            type="submit"
            disabled={!hasToken || isLoading || !isValid}
            className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 h-11 w-full"
          >
            {isLoading ? 'Saving...' : 'SET NEW PASSWORD'}
          </Button>
        </fieldset>
      </form>
    </div>
  );
}
