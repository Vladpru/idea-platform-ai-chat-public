import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  type ThemePreference,
  patchTheme,
} from '@/features/profile/api/profile.api';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef } from 'react';

function preferenceToClientTheme(pref: ThemePreference): string {
  switch (pref) {
    case 'LIGHT':
      return 'light';
    case 'DARK':
      return 'dark';
    default:
      return 'system';
  }
}

function clientThemeToPreference(theme: string): ThemePreference {
  if (theme === 'light') return 'LIGHT';
  if (theme === 'dark') return 'DARK';
  return 'SYSTEM';
}

export function useThemeSync(themePreference: ThemePreference | undefined) {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore(s => s.accessToken);
  const lastSyncedPref = useRef<ThemePreference | undefined>(undefined);
  const pendingLocalChange = useRef(false);

  useEffect(() => {
    if (!themePreference || pendingLocalChange.current) return;
    if (lastSyncedPref.current === themePreference) return;
    lastSyncedPref.current = themePreference;
    setTheme(preferenceToClientTheme(themePreference));
  }, [themePreference, setTheme]);

  const debouncedPersist = useMemo(
    () =>
      debounce((pref: ThemePreference) => {
        if (!useAuthSessionStore.getState().accessToken) {
          pendingLocalChange.current = false;
          return;
        }
        void patchTheme({ theme: pref })
          .then(user => {
            queryClient.setQueryData(['users', 'me'], user);
            const token = useAuthSessionStore.getState().accessToken;
            if (token) {
              useAuthSessionStore.getState().setSession(user, token);
            }
            lastSyncedPref.current = user.themePreference;
          })
          .finally(() => {
            pendingLocalChange.current = false;
          });
      }, 800),
    [queryClient],
  );

  useEffect(() => () => debouncedPersist.cancel(), [debouncedPersist]);

  const handleThemeChange = useCallback(
    (next: string) => {
      pendingLocalChange.current = true;
      setTheme(next);
      if (accessToken) {
        debouncedPersist(clientThemeToPreference(next));
      } else {
        pendingLocalChange.current = false;
      }
    },
    [accessToken, debouncedPersist, setTheme],
  );

  const currentTheme =
    theme ?? preferenceToClientTheme(themePreference ?? 'SYSTEM');

  return { theme: currentTheme, setTheme: handleThemeChange };
}
