import { NotFoundPage } from '@/pages/not-found';
import { pageDocumentHead } from '@/shared/lib/document-head';
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router';

export type RouterContext = {
  isAuthenticated: boolean;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
  head: () => pageDocumentHead(''),
  notFoundComponent: () => <NotFoundPage />,
});
