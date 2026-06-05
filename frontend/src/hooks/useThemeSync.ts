import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  type ThemePreference,
  patchTheme,
} from '@/features/profile/api/profile.api';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@/app/providers/theme-context';

function clientThemeToPreference(theme: string): ThemePreference {
  if (theme === 'light') return 'LIGHT';
  if (theme === 'dark') return 'DARK';
  return 'SYSTEM';
}

function preferenceToClientTheme(
  pref: ThemePreference,
): 'light' | 'dark' | 'system' {
  if (pref === 'LIGHT') return 'light';
  if (pref === 'DARK') return 'dark';
  return 'system';
}

export function useThemeSync(themePreference: ThemePreference | undefined) {
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore(s => s.accessToken);

  const { theme: localTheme, setTheme: setLocalTheme } = useTheme();

  const lastSyncedPref = useRef<ThemePreference | undefined>(undefined);
  const pendingLocalChange = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!themePreference || pendingLocalChange.current) return;
    if (lastSyncedPref.current === themePreference) return;

    lastSyncedPref.current = themePreference;
    const normalizedPref = preferenceToClientTheme(themePreference);

    if (localTheme !== normalizedPref) {
      setLocalTheme(normalizedPref);
    }
  }, [themePreference, localTheme, setLocalTheme]);

  const persistTheme = useCallback(
    (pref: ThemePreference) => {
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
    },
    [queryClient],
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleThemeChange = useCallback(
    (next: 'light' | 'dark' | 'system') => {
      pendingLocalChange.current = true;

      setLocalTheme(next);

      if (accessToken) {
        debouncedPersist(clientThemeToPreference(next));
      } else {
        pendingLocalChange.current = false;
      }
    },
    [accessToken, debouncedPersist, setLocalTheme],
  );

  return { theme: localTheme, setTheme: handleThemeChange };
}
