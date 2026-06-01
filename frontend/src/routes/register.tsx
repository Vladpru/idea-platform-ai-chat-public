import { hasValidSession } from '@/features/auth/model/auth-session-store';
import { RegisterPage } from '@/pages/register';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (hasValidSession()) {
      throw redirect({ to: '/profile' });
    }
  },
  head: () => pageDocumentHead('Sign Up'),
  component: RegisterPage,
});
