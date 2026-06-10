import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/profile/')({
  beforeLoad: () => {
    const userId = useAuthSessionStore.getState().user?.id;
    if (!userId) {
      throw redirect({ to: '/login' });
    }
    throw redirect({
      to: '/profile/$profileId',
      params: { profileId: userId },
      search: { tab: 'all' },
    });
  },
});
