import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { Button, Input, Label, Separator } from '@/shared/ui';

import { register as registerUser } from '../api/auth';
import { type RegisterValues, registerSchema } from '../model/register-schema';
import { GoogleLoginButton } from './GoogleAuthButton';

export function RegisterForm() {
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterValues) => {
    setSubmitError(null);
    try {
      await registerUser({ email: data.email, password: data.password });
      await navigate({ to: '/profile', replace: true });
    } catch (e) {
      setSubmitError(
        getApiErrorMessage(e, { invalidCredentialsMessage: 'Sign up failed' }),
      );
    }
  };

  return (
    <div className="mt-6 w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <p className="text-destructive text-sm font-medium">{submitError}</p>
        )}
        <div className="space-y-2">
          <Label htmlFor={emailId}>EMAIL</Label>
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 py-2.5"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-destructive text-xs font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={passwordId}>PASSWORD</Label>
          <div className="relative">
            <Input
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create password"
              className="h-11 py-2.5 pr-10"
              {...register('password')}
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={confirmPasswordId}>CONFIRM PASSWORD</Label>
          <div className="relative">
            <Input
              id={confirmPasswordId}
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirm password"
              className="h-11 py-2.5 pr-10"
              {...register('confirmPassword')}
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2"
              onClick={() => setShowConfirmPassword(v => !v)}
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-destructive text-xs font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
          SIGN UP
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-[11px] font-medium">
            OR
          </span>
          <Separator className="flex-1" />
        </div>

        <GoogleLoginButton mode={'signup'} />
      </form>

      <p className="text-muted-foreground pt-2 text-center text-sm">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-primary font-semibold underline underline-offset-4"
        >
          SIGN IN
        </Link>
      </p>
    </div>
  );
}
