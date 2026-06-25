import { createFileRoute, redirect } from '@tanstack/react-router';

import { hasValidSession } from '@/features/auth/model/auth-session-store';
import { ForgotPasswordPage } from '@/pages/forgotPassword';
import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/forgotPassword')({
  beforeLoad: () => {
    if (hasValidSession()) {
      throw redirect({ to: '/profile' });
    }
  },
  head: () => pageDocumentHead('Forgot Password'),
  component: ForgotPasswordPage,
});
