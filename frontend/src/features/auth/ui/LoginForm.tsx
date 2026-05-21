import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { passwordMaxLengthRule } from '@/shared/lib/password-rules';
import { Button, Input, Label, Separator } from '@/shared/ui';

import { useAuthSessionStore } from '../model/auth-session-store';
import { login as loginUser } from '../api/auth';
import { type LoginValues, loginSchema } from '../model/login-schema';
import { GoogleLoginButton } from './GoogleAuthButton';
import { PasswordInput } from './PasswordInput';

export function LoginForm() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginValues) => {
    setSubmitError(null);
    try {
      await loginUser({ email: data.email, password: data.password });
      await navigate({ to: '/profile', replace: true });
    } catch (e) {
      useAuthSessionStore.getState().clearSession();
      setSubmitError(
        getApiErrorMessage(e, {
          invalidCredentialsMessage: 'Invalid email or password',
        }),
      );
    }
  };

  return (
    <div className="mt-6 w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {submitError && (
          <p
            role="alert"
            aria-live="polite"
            className="text-destructive text-sm font-medium"
          >
            {submitError}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="login-email" className="text-brand-gray-600 text-xs">
            EMAIL
          </Label>
          <Input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            className="rounded-sm bg-transparent py-2.5"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-destructive text-xs font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <PasswordInput
            id="login-password"
            label="PASSWORD"
            placeholder="••••••••"
            autoComplete="current-password"
            registration={register('password', {
              maxLength: passwordMaxLengthRule,
            })}
            error={errors.password?.message}
          />
          <div className="flex h-18 items-start justify-end">
            <Link
              to="/forgotPassword"
              className="text-brand-dark-blue hover:text-brand-dark-blue/80 dark:text-brand-light-blue dark:hover:text-brand-light-blue/80 text-xs font-medium hover:underline hover:underline-offset-2"
            >
              FORGOT PASSWORD?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 h-11 w-full"
        >
          {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-[11px] font-medium">
            OR
          </span>
          <Separator className="flex-1" />
        </div>

        <GoogleLoginButton mode="signin" />
      </form>
    </div>
  );
}
