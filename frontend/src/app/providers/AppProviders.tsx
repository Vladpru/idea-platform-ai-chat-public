import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { getApiErrorStatus } from '@/shared/api/api-error';

import { SonnerProvider } from './sonner-provider';
import { ThemeProvider } from './theme-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry(failureCount, error) {
        const status = getApiErrorStatus(error);
        if (status !== undefined && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SonnerProvider>{children}</SonnerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
