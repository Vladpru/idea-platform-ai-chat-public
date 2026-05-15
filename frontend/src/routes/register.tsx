import { RegisterPage } from '@/pages/register';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { hasStoredAuthToken } from '@/shared/lib/auth-token';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (hasStoredAuthToken()) {
      throw redirect({ to: '/profile' });
    }
  },
  component: RegisterPage,
});
