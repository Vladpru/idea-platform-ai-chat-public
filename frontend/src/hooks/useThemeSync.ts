import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  type ThemePreference,
  patchTheme,
} from '@/features/profile/api/profile.api';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@/app/providers/theme-context';

function clientThemeToPreference(theme: string): ThemePreference {
  if (theme === 'dark') return 'DARK';
  return 'LIGHT';
}

function preferenceToClientTheme(
  pref: ThemePreference,
): 'light' | 'dark' | 'system' {
  if (pref === 'LIGHT') return 'light';
  if (pref === 'DARK') return 'dark';
  return 'light';
}

export function useThemeSync(themePreference: ThemePreference | undefined) {
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore(s => s.accessToken);

  const { theme: localTheme, setTheme: setLocalTheme } = useTheme();

  const lastSyncedPref = useRef<ThemePreference | undefined>(undefined);
  const pendingLocalChange = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pendingLocalChange.current) return;

    const effectivePref = themePreference ?? 'LIGHT';
    if (lastSyncedPref.current === effectivePref) return;

    lastSyncedPref.current = effectivePref;
    const normalizedPref = preferenceToClientTheme(effectivePref);

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

      const fallbackPref = lastSyncedPref.current || 'LIGHT';

      void patchTheme({ theme: pref })
        .then(user => {
          queryClient.setQueryData(['users', 'me'], user);
          const token = useAuthSessionStore.getState().accessToken;
          if (token) {
            useAuthSessionStore.getState().setSession(user, token);
          }
          lastSyncedPref.current = user.themePreference;
        })
        .catch(error => {
          setLocalTheme(preferenceToClientTheme(fallbackPref));

          console.error('Theme sync failed:', error);
        })
        .finally(() => {
          pendingLocalChange.current = false;
        });
    },
    [queryClient, setLocalTheme],
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

      const resolved = next === 'system' ? 'light' : next;
      setLocalTheme(resolved);

      if (accessToken) {
        debouncedPersist(clientThemeToPreference(resolved));
      } else {
        pendingLocalChange.current = false;
      }
    },
    [accessToken, debouncedPersist, setLocalTheme],
  );

  return { theme: localTheme, setTheme: handleThemeChange };
}
