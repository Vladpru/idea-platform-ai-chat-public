import { RegisterPage } from '@/pages/register';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { hasValidSession } from '@/features/auth/model/auth-session-store';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (hasValidSession()) {
      throw redirect({ to: '/profile' });
    }
  },
  component: RegisterPage,
});
