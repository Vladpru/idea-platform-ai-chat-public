import { ResetPasswordPage } from '@/pages/resetPassword';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { hasStoredAuthToken } from '@/shared/lib/auth-token';

export const Route = createFileRoute('/reset-password')({
  beforeLoad: () => {
    if (hasStoredAuthToken()) {
      throw redirect({ to: '/profile' });
    }
  },
  head: () => pageDocumentHead('Set New Password'),
  component: ResetPasswordPage,
});
