import { hasValidSession } from '@/features/auth/model/auth-session-store';
import { LoginPage } from '@/pages/login';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (hasValidSession()) {
      throw redirect({ to: '/profile' });
    }
  },
  head: () => pageDocumentHead('Sign In'),
  component: LoginPage,
});
