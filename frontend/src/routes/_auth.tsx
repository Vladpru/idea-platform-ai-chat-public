import { AppHeader } from '@/widgets/header';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';

import { hasStoredAuthToken } from '@/shared/lib/auth-token';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (!hasStoredAuthToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <>
      <AppHeader />
      <Outlet />
    </>
  ),
});
