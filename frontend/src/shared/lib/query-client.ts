import { getApiErrorStatus } from '@/shared/api/api-error';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
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

export function clearAuthenticatedQueryCache(): void {
  queryClient.clear();
}
