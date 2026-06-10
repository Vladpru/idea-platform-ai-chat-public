import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { fetchCurrentUser } from '@/features/profile/api/profile.api';
import { currentUserQueryKey } from '@/features/settings/hooks/use-notification-preferences';
import { useQuery } from '@tanstack/react-query';

/**
 * Keeps persisted auth session in sync with the database profile
 * (e.g. after Google login or profile edits in another tab).
 */
export function AuthSessionSync() {
  const accessToken = useAuthSessionStore(s => s.accessToken);
  const sessionUserId = useAuthSessionStore(s => s.user?.id);

  useQuery({
    queryKey: sessionUserId
      ? currentUserQueryKey(sessionUserId)
      : ['users', 'me'],
    queryFn: async () => {
      const user = await fetchCurrentUser();
      const token = useAuthSessionStore.getState().accessToken;
      if (token) {
        useAuthSessionStore.getState().setSession(user, token);
      }
      return user;
    },
    enabled: Boolean(accessToken && sessionUserId),
    staleTime: 60_000,
  });

  return null;
}
