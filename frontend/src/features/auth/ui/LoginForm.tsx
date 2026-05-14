import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { Button, Input, Label, Separator } from '@/shared/ui';

import { login as loginUser } from '../api/auth';
import { type LoginValues, loginSchema } from '../model/login-schema';
import { GoogleLoginButton } from './GoogleAuthButton';

export function LoginForm() {
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const [showPassword, setShowPassword] = useState(false);
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
      await navigate({ to: '/', replace: true });
    } catch (e) {
      setSubmitError(
        getApiErrorMessage(e, {
          invalidCredentialsMessage: 'Email or password is incorrect',
        }),
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
              autoComplete="current-password"
              placeholder="••••••••"
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

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-auto px-0 py-0 text-xs font-medium"
            >
              FORGOT PASSWORD?
            </Button>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
          SIGN IN
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-[11px] font-medium">
            OR
          </span>
          <Separator className="flex-1" />
        </div>

        <GoogleLoginButton mode={'signin'} />
      </form>

      <p className="text-muted-foreground pt-2 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="text-primary font-semibold underline underline-offset-4"
        >
          SIGN UP
        </Link>
      </p>
    </div>
  );
}
