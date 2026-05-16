import { NotFoundPage } from '@/pages/not-found';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

export type RouterContext = {
  isAuthenticated: boolean;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  notFoundComponent: () => <NotFoundPage />,
});
