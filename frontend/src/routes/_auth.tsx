import { AuthSessionSync, useAuthSessionStore } from '@/features/auth';
import { NotificationSocketProvider } from '@/features/notifications';
import { NotFoundPage } from '@/pages/not-found';
import { AppHeader } from '@/widgets/header';
import { Navigate, createFileRoute, redirect } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';

import { useOfflineHydration } from '@/shared/offline/use-offline-hydration';
import { OfflineIndicator } from '@/shared/ui/offline-indicator';

function AuthLayout() {
  const isHydrating = useAuthSessionStore(s => s.isHydrating);
  const user = useAuthSessionStore(s => s.user);

  useOfflineHydration();

  if (isHydrating) {
    return (
      <div className="text-muted-foreground flex h-dvh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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
    const { isHydrating, user } = useAuthSessionStore.getState();
    if (!isHydrating && !user) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthLayout,
  notFoundComponent: () => <NotFoundPage variant="content" />,
});
