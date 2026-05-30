import { createFileRoute, redirect } from '@tanstack/react-router';

import { ForgotPasswordPage } from '@/pages/forgotPassword';
import { hasStoredAuthToken } from '@/shared/lib/auth-token';
import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/forgotPassword')({
  beforeLoad: () => {
    if (hasStoredAuthToken()) {
      throw redirect({ to: '/profile' });
    }
  },
  head: () => pageDocumentHead('Forgot Password'),
  component: ForgotPasswordPage,
});
