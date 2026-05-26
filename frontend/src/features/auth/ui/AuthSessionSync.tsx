import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { fetchCurrentUser } from '@/features/profile/api/profile.api';
import { useQuery } from '@tanstack/react-query';

/**
 * Keeps persisted auth session in sync with the database profile
 * (e.g. after Google login or profile edits in another tab).
 */
export function AuthSessionSync() {
  const accessToken = useAuthSessionStore(s => s.accessToken);

  useQuery({
    queryKey: ['users', 'me', 'session-sync'],
    queryFn: async () => {
      const user = await fetchCurrentUser();
      const token = useAuthSessionStore.getState().accessToken;
      if (token) {
        useAuthSessionStore.getState().setSession(user, token);
      }
      return user;
    },
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  return null;
}
