import { createFileRoute, redirect } from '@tanstack/react-router';

import { hasStoredAuthToken } from '@/shared/lib/auth-token';
import { ForgotPasswordPage } from '@/pages/forgotPassword';

export const Route = createFileRoute('/forgotPassword')({
  beforeLoad: () => {
    if (hasStoredAuthToken()) {
      throw redirect({ to: '/profile' });
    }
  },
  component: ForgotPasswordPage,
});
