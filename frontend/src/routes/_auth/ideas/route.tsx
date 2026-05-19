import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/ideas')({
  component: () => <Outlet />,
});
