import { NotFoundPage } from '@/pages/not-found';
import { OfflinePage } from '@/pages/offline';
import { pageDocumentHead } from '@/shared/lib/document-head';
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { isAxiosError } from 'axios';

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
  errorComponent: ({ error }) => {
    const isNetworkError =
      !navigator.onLine ||
      (isAxiosError(error) && !error.response);
    if (isNetworkError) return <OfflinePage />;
    return (
      <div className="flex min-h-svh flex-col items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Something went wrong. Please try refreshing the page.
        </p>
      </div>
    );
  },
});
