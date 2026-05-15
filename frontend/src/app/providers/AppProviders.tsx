import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/features/theme';

import { SonnerProvider } from './sonner-provider';
import { ThemeProvider } from './theme-provider';

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SonnerProvider>
          {children}
          <ThemeToggle />
        </SonnerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
