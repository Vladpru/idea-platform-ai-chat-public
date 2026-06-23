import { NotFoundPage } from '@/pages/not-found';
import { OfflinePage } from '@/pages/offline';
import { PostHogProvider } from '@posthog/react';
import * as Sentry from '@sentry/react';
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { isAxiosError } from 'axios';

import { pageDocumentHead } from '@/shared/lib/document-head';

export type RouterContext = {
  isAuthenticated: boolean;
};

function RootComponent() {
  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN!}
      options={{
        api_host: import.meta.env.VITE_POSTHOG_API_HOST ?? '/ingest',
        ui_host:
          import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
        defaults: '2026-01-30',
        capture_pageview: false,
        capture_exceptions: !import.meta.env.DEV,
        debug: import.meta.env.DEV,
        opt_out_capturing_by_default: import.meta.env.DEV,
        disable_session_recording: import.meta.env.DEV,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: '[data-ph-mask]',
        },
      }}
    >
      <HeadContent />
      <Sentry.ErrorBoundary
        fallback={
          <div className="flex min-h-svh flex-col items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Something went wrong. Please try refreshing the page.
            </p>
          </div>
        }
      >
        <Outlet />
      </Sentry.ErrorBoundary>
    </PostHogProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  head: () => pageDocumentHead(''),
  notFoundComponent: () => <NotFoundPage />,
  errorComponent: ({ error }) => {
    const isNetworkError =
      !navigator.onLine || (isAxiosError(error) && !error.response);
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
