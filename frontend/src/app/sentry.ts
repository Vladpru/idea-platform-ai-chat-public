import * as Sentry from '@sentry/react';

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    tracePropagationTargets: [/\/api\//],
    beforeSend(event) {
      try {
        const w = window as unknown as {
          posthog?: {
            get_session_replay_url?: (opts: {
              withTimestamp: boolean;
            }) => string;
          };
        };
        const sessionUrl = w.posthog?.get_session_replay_url?.({
          withTimestamp: true,
        });
        if (sessionUrl) {
          event.tags = { ...event.tags, posthog_session_url: sessionUrl };
        }
      } catch {
        // posthog not available, skip
      }
      return event;
    },
  });
}
