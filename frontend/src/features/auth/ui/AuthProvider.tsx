import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { fetchCurrentUser } from '@/features/profile/api/profile.api';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthSessionStore } from '../model/auth-session-store';

let hydrationStarted = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (hydrationStarted) return;
    hydrationStarted = true;

    const { setSession, clearSession, setHydrating } =
      useAuthSessionStore.getState();

    void (async () => {
      try {
        const user = await fetchCurrentUser();
        queryClient.setQueryData(['users', 'me'], user);
        setSession(user);
      } catch {
        clearSession();
      } finally {
        setHydrating(false);
      }
    })();
  }, []);

  return <>{children}</>;
}
