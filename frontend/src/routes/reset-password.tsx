import { ResetPasswordPage } from '@/pages/resetPassword';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { hasValidSession } from '@/features/auth/model/auth-session-store';

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/reset-password')({
  validateSearch: search => resetPasswordSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    const token =
      typeof search.token === 'string' ? search.token.trim() : '';
    if (hasValidSession() && !token) {
      throw redirect({ to: '/profile' });
    }
  },
  head: () => pageDocumentHead('Set New Password'),
  component: ResetPasswordPage,
});
