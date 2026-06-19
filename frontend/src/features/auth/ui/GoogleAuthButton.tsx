import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { usePostHog } from '@posthog/react';

import { Button } from '@/shared/ui';
import { GoogleIcon } from '@/shared/ui/icons';

import { loginWithGoogleAccessToken } from '../api/auth';
import { requestGoogleAccessToken } from '../api/google-auth';
import { useAuthSessionStore } from '../model/auth-session-store';

interface Props {
  mode: 'signin' | 'signup';
}

export function GoogleLoginButton({ mode }: Props) {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setIsBusy(true);
    try {
      const googleToken = await requestGoogleAccessToken();
      await loginWithGoogleAccessToken(googleToken);
      const user = useAuthSessionStore.getState().user;
      if (user) {
        posthog.identify(user.id, { email: user.email, name: user.name });
        posthog.capture(mode === 'signup' ? 'user_signed_up' : 'user_logged_in', { method: 'google' });
      }
      await navigate({ to: '/profile', replace: true });
    } catch (e) {
      setError((e as Error)?.message ?? 'Google sign-in failed');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="text-primary hover:bg-brand-dark-blue/10 dark:border-primary dark:text-primary dark:hover:bg-primary/10 border-brand-dark-blue h-10 w-full border bg-transparent"
        isLoading={isBusy}
        onClick={() => void handleLogin()}
      >
        <GoogleIcon className="h-4 w-4" />
        {mode === 'signin' ? 'SIGN IN WITH GOOGLE' : 'SIGN UP WITH GOOGLE'}
      </Button>
      {error && (
        <p className="text-destructive text-center text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
