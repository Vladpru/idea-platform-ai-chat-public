import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/settings/notifications')({
  beforeLoad: () => {
    throw redirect({
      to: '/settings',
      search: { tab: 'notifications' },
    });
  },
});
