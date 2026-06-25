import { queryClient } from '@/shared/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/ui/AuthProvider';
import { SonnerProvider } from './sonner-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SonnerProvider>
          <AuthProvider>{children}</AuthProvider>
        </SonnerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
