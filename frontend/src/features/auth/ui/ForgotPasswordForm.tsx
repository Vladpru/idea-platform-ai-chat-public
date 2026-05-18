import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { Button, Input, Label } from '@/shared/ui';

import { requestPasswordReset } from '../api/password-reset-api';
import {
  type ForgotPasswordRequestValues,
  forgotPasswordRequestSchema,
} from '../model/forgot-password-request-schema';

export function ForgotPasswordForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ForgotPasswordRequestValues>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordRequestValues) => {
    setServerError(null);
    try {
      const { message } = await requestPasswordReset(data.email);
      setSuccessMessage(message);
      setIsSuccess(true);
    } catch (error) {
      setServerError(
        getApiErrorMessage(error, {
          invalidCredentialsMessage:
            'Something went wrong. Please try again later.',
        }),
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="mt-6 w-full">
        <p
          role="status"
          aria-live="polite"
          className="text-brand-gray-700 text-center text-sm leading-relaxed"
        >
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 w-full">
      {serverError && (
        <div className="bg-destructive/15 mb-4 rounded-md p-3">
          <p className="text-destructive text-sm font-medium">{serverError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="forgot-password-email"
            className="text-brand-gray-600 text-xs"
          >
            EMAIL
          </Label>
          <Input
            id="forgot-password-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            className="rounded-sm bg-transparent py-2.5"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            disabled={isSubmitting}
            {...register('email')}
          />
          {errors.email && (
            <p
              id="email-error"
              className="text-destructive text-xs font-medium"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 h-11 w-full"
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
    </div>
  );
}
