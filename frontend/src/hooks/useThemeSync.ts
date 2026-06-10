import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  type CurrentUser,
  type ThemePreference,
  mergeCurrentUser,
  patchTheme,
} from '@/features/profile/api/profile.api';
import { currentUserQueryKey } from '@/features/settings/hooks/use-notification-preferences';
import {
  preferenceToTheme,
  themeToPreference,
} from '@/shared/lib/theme-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@/app/providers/theme-context';

export function useThemeSync() {
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore(s => s.accessToken);
  const userId = useAuthSessionStore(s => s.user?.id);
  const themePreference = useAuthSessionStore(s => s.user?.themePreference);

  const { theme, setTheme: setContextTheme } = useTheme();

  const lastPersistedPref = useRef<ThemePreference | undefined>(
    themePreference,
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    lastPersistedPref.current = themePreference;
  }, [themePreference]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const persistTheme = useCallback(
    (pref: ThemePreference) => {
      if (!useAuthSessionStore.getState().accessToken) {
        return;
      }

      const fallbackPref = lastPersistedPref.current ?? 'SYSTEM';

      void patchTheme({ theme: pref })
        .then(user => {
          const activeUserId = useAuthSessionStore.getState().user?.id;
          if (activeUserId) {
            queryClient.setQueryData<CurrentUser>(
              currentUserQueryKey(activeUserId),
              previous => mergeCurrentUser(previous, user),
            );
          }
          const token = useAuthSessionStore.getState().accessToken;
          if (token) {
            useAuthSessionStore.getState().setSession(user, token);
          }
          lastPersistedPref.current = user.themePreference;
        })
        .catch(error => {
          setContextTheme(preferenceToTheme(fallbackPref));
          console.error('Theme sync failed:', error);
        });
    },
    [queryClient, setContextTheme],
  );

  const debouncedPersist = useCallback(
    (pref: ThemePreference) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        persistTheme(pref);
      }, 800);
    },
    [persistTheme],
  );

  const setTheme = useCallback(
    (next: 'light' | 'dark' | 'system') => {
      setContextTheme(next);

      if (userId) {
        useAuthSessionStore.setState(state => ({
          user: state.user
            ? { ...state.user, themePreference: themeToPreference(next) }
            : null,
        }));
      }

      if (accessToken) {
        debouncedPersist(themeToPreference(next));
      }
    },
    [accessToken, debouncedPersist, setContextTheme, userId],
  );

  return { theme, setTheme };
}
