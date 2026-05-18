import { ResetPasswordPage } from '@/pages/resetPassword';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { hasStoredAuthToken } from '@/shared/lib/auth-token';

export const Route = createFileRoute('/reset-password')({
  beforeLoad: () => {
    if (hasStoredAuthToken()) {
      throw redirect({ to: '/profile' });
    }
  },
  component: ResetPasswordPage,
});
