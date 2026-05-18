import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { Button, Input, Label, Separator } from '@/shared/ui';

import { useAuthSessionStore } from '../model/auth-session-store';
import { register as registerUser } from '../api/auth';
import { type RegisterValues, registerSchema } from '../model/register-schema';
import { GoogleLoginButton } from './GoogleAuthButton';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

export function RegisterForm() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordsVisible, setPasswordsVisible] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterValues) => {
    setSubmitError(null);
    try {
      await registerUser({ email: data.email, password: data.password });
      await navigate({ to: '/profile', replace: true });
    } catch (e) {
      useAuthSessionStore.getState().clearSession();
      setSubmitError(
        getApiErrorMessage(e, { invalidCredentialsMessage: 'Sign up failed' }),
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
          <Label
            htmlFor="register-email"
            className="text-brand-gray-600 text-xs"
          >
            EMAIL
          </Label>
          <Input
            id="register-email"
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

        <div className="flex flex-col gap-1">
          <PasswordInput
            id="register-password"
            label="PASSWORD"
            placeholder="Create password"
            autoComplete="new-password"
            registration={register('password')}
            error={errors.password?.message}
            passwordVisible={passwordsVisible}
            onPasswordVisibleChange={setPasswordsVisible}
          />
          <PasswordStrengthIndicator password={passwordValue} />
        </div>

        <PasswordInput
          id="register-confirm-password"
          label="CONFIRM PASSWORD"
          placeholder="Confirm password"
          autoComplete="new-password"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          passwordVisible={passwordsVisible}
          onPasswordVisibleChange={setPasswordsVisible}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 h-11 w-full"
        >
          {isSubmitting ? 'SIGNING UP...' : 'SIGN UP'}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-[11px] font-medium">
            OR
          </span>
          <Separator className="flex-1" />
        </div>

        <GoogleLoginButton mode="signup" />
      </form>
    </div>
  );
}
