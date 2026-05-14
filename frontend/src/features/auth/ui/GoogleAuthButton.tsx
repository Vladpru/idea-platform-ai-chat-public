import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@/shared/ui';
import { GoogleIcon } from '@/shared/ui/icons';

import { loginWithGoogleAccessToken } from '../api/auth';
import { requestGoogleAccessToken } from '../api/google-auth';

interface Props {
  mode: 'signin' | 'signup';
}

export function GoogleLoginButton({ mode }: Props) {
  const navigate = useNavigate();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setIsBusy(true);
    try {
      const googleToken = await requestGoogleAccessToken();
      await loginWithGoogleAccessToken(googleToken);
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
        className="h-10 w-full border border-brand-dark-blue bg-transparent text-brand-dark-blue hover:bg-brand-dark-blue/10 dark:border-brand-light-blue dark:text-brand-light-blue dark:hover:bg-brand-light-blue/10"
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
