import { LoginPage } from '@/pages/login';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { hasValidSession } from '@/features/auth/model/auth-session-store';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (hasValidSession()) {
      throw redirect({ to: '/profile' });
    }
  },
  component: LoginPage,
});
