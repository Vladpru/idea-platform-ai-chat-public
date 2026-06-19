import { createRouter } from '@tanstack/react-router';
import posthog from 'posthog-js';

import { routeTree } from '../routeTree.gen';
import { NotFoundPage } from '@/pages/not-found';

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultNotFoundComponent: () => <NotFoundPage variant="content" />,
  context: {
    isAuthenticated: false,
  },
});

router.subscribe('onBeforeLoad', () => {
  posthog.capture('$pageleave');
});

router.subscribe('onResolved', () => {
  posthog.capture('$pageview');
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
