import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  type ThemePreference,
  patchTheme,
} from '@/features/profile/api/profile.api';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

function preferenceToClientTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'SYSTEM') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return pref === 'DARK' ? 'dark' : 'light';
}

function clientThemeToPreference(theme: string): ThemePreference {
  if (theme === 'light') return 'LIGHT';
  if (theme === 'dark') return 'DARK';
  return 'SYSTEM';
}

export function useThemeSync(themePreference: ThemePreference | undefined) {
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore(s => s.accessToken);
  const lastSyncedPref = useRef<ThemePreference | undefined>(undefined);
  const pendingLocalChange = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTheme = useCallback((themeMode: 'light' | 'dark') => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (!themePreference || pendingLocalChange.current) return;
    if (lastSyncedPref.current === themePreference) return;
    lastSyncedPref.current = themePreference;
    applyTheme(preferenceToClientTheme(themePreference));
  }, [themePreference, applyTheme]);

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
    (next: string) => {
      pendingLocalChange.current = true;

      const root = window.document.documentElement;
      if (next === 'dark') {
        root.classList.add('dark');
      } else if (next === 'light') {
        root.classList.remove('dark');
      } else {
        const systemDark = window.matchMedia(
          '(prefers-color-scheme: dark)',
        ).matches;
        if (systemDark) root.classList.add('dark');
        else root.classList.remove('dark');
      }

      if (accessToken) {
        debouncedPersist(clientThemeToPreference(next));
      } else {
        pendingLocalChange.current = false;
      }
    },
    [accessToken, debouncedPersist],
  );

  const currentTheme = themePreference ?? 'SYSTEM';

  return { theme: currentTheme, setTheme: handleThemeChange };
}
