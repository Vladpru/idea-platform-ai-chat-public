import { createRouter } from '@tanstack/react-router';

import { routeTree } from '../routeTree.gen';
import { NotFoundPage } from '@/pages/not-found';

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => <NotFoundPage variant="content" />,
  context: {
    isAuthenticated: false,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
