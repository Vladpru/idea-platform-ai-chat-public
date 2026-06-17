import { fetchIdeasDashboard } from '@/features/ideas/api/ideas.api';
import { fetchMyProblems } from '@/features/problems/api/problems.api';
import { fetchCurrentUser } from '@/features/profile/api/profile.api';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { useEffect, useRef } from 'react';

const HYDRATION_LIMIT = 50;

export function useOfflineHydration(): void {
  const userId = useAuthSessionStore(state => state.user?.id ?? null);
  const hydratedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function hydrate(): Promise<void> {
      if (!navigator.onLine || hydratedUserIdRef.current === userId) return;

      try {
        await Promise.allSettled([
          fetchIdeasDashboard({
            tab: 'published',
            limit: HYDRATION_LIMIT,
            page: 1,
          }),
          fetchIdeasDashboard({
            tab: 'drafts',
            limit: HYDRATION_LIMIT,
            page: 1,
          }),
          fetchMyProblems({ limit: HYDRATION_LIMIT, page: 1 }),
          fetchCurrentUser(),
        ]);
        hydratedUserIdRef.current = userId;
      } catch (error) {
        console.error(
          '[Offline Hydration] System error during background sync:',
          error,
        );
      }
    }

    void hydrate();

    window.addEventListener('online', hydrate);
    return () => window.removeEventListener('online', hydrate);
  }, [userId]);
}
