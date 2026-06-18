import { AuthSessionSync } from '@/features/auth';
import { hasValidSession } from '@/features/auth/model/auth-session-store';
import { NotificationSocketProvider } from '@/features/notifications';
import { NotFoundPage } from '@/pages/not-found';
import { AppHeader } from '@/widgets/header';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';

import { useOfflineHydration } from '@/shared/offline/use-offline-hydration';
import { OfflineIndicator } from '@/shared/ui/offline-indicator';

function AuthLayout() {
  useOfflineHydration();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AuthSessionSync />
      <NotificationSocketProvider />
      <AppHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
      <OfflineIndicator />
    </div>
  );
}

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (!hasValidSession()) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthLayout,
  notFoundComponent: () => <NotFoundPage variant="content" />,
});
