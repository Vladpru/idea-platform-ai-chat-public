import { NotFoundPage } from '@/pages/not-found';
import { OfflinePage } from '@/pages/offline';
import { pageDocumentHead } from '@/shared/lib/document-head';
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { PostHogProvider } from '@posthog/react';

export type RouterContext = {
  isAuthenticated: boolean;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN!}
      options={{
        api_host: '/ingest',
        ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
        defaults: '2026-01-30',
        capture_pageview: false,
        capture_exceptions: true,
        debug: import.meta.env.DEV,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: '[data-ph-mask]',
        },
      }}
    >
      <HeadContent />
      <Outlet />
    </PostHogProvider>
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
