import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { fetchCurrentUser } from '@/features/profile/api/profile.api';
import { currentUserQueryKey } from '@/features/settings/hooks/use-notification-preferences';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Keeps persisted auth session in sync with the database profile
 * (e.g. after Google login or profile edits in another tab).
 */
export function AuthSessionSync() {
  const accessToken = useAuthSessionStore(s => s.accessToken);
  const sessionUserId = useAuthSessionStore(s => s.user?.id);

  const { data: remoteUser } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchCurrentUser,
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!remoteUser) return;

    const { accessToken: token, user: localUser } =
      useAuthSessionStore.getState();
    if (!token) return;

    const unchanged =
      localUser?.id === remoteUser.id &&
      localUser.email === remoteUser.email &&
      localUser.firstName === (remoteUser.firstName ?? '') &&
      localUser.lastName === (remoteUser.lastName ?? '') &&
      localUser.picture === (remoteUser.avatarUrl ?? null);

    if (unchanged) return;

    useAuthSessionStore.getState().setSession(remoteUser, token);
  }, [remoteUser]);

  return null;
}
