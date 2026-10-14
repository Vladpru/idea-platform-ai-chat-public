import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { fetchCurrentUser } from '@/features/profile/api/profile.api';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Keeps persisted auth session in sync with the database profile
 * (e.g. after Google login or profile edits in another tab).
 */
export function AuthSessionSync() {
  const userId = useAuthSessionStore(s => s.user?.id);

  const { data: remoteUser } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchCurrentUser,
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!remoteUser) return;

    const { user: localUser } = useAuthSessionStore.getState();
    if (!localUser) return;

    const unchanged =
      localUser?.id === remoteUser.id &&
      localUser.email === remoteUser.email &&
      localUser.firstName === (remoteUser.firstName ?? '') &&
      localUser.lastName === (remoteUser.lastName ?? '') &&
      localUser.picture === (remoteUser.avatarUrl ?? null) &&
      localUser.themePreference === remoteUser.themePreference &&
      localUser.role === remoteUser.role;

    if (unchanged) return;

    useAuthSessionStore.getState().setSession(remoteUser);
  }, [remoteUser]);

  return null;
}
