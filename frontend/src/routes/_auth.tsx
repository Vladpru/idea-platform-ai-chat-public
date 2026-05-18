import { NotFoundPage } from '@/pages/not-found';
import { AppHeader } from '@/widgets/header';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';

import { hasValidSession } from '@/features/auth/model/auth-session-store';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (!hasValidSession()) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <>
      <AppHeader />
      <Outlet />
    </>
  ),
  notFoundComponent: () => <NotFoundPage variant="content" />,
});
