import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  applyThemeToDocument,
  clearGuestStoredTheme,
  readAuthSessionFromStorage,
  resolveActiveTheme,
  writeStoredTheme,
} from '@/shared/lib/theme-storage';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ThemeProviderContext, type Theme } from './theme-context';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  ...props
}: ThemeProviderProps) {
  const userId = useAuthSessionStore(s => s.user?.id ?? null);
  const themePreference = useAuthSessionStore(
    s => s.user?.themePreference ?? null,
  );
  const previousUserIdRef = useRef<string | null>(userId);

  const [theme, setThemeState] = useState<Theme>(() => {
    const restored = readAuthSessionFromStorage();
    return (
      resolveActiveTheme(restored.userId, restored.themePreference) ??
      defaultTheme
    );
  });

  useEffect(() => {
    const wasAuthenticated = previousUserIdRef.current !== null;
    const isAuthenticated = userId !== null;

    if (wasAuthenticated && !isAuthenticated) {
      clearGuestStoredTheme();
    }

    previousUserIdRef.current = userId;

    const resolved = resolveActiveTheme(userId, themePreference);
    setThemeState(resolved);
    applyThemeToDocument(resolved);
  }, [userId, themePreference]);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme, userId]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      writeStoredTheme(nextTheme, userId);
      setThemeState(nextTheme);
      applyThemeToDocument(nextTheme);
    },
    [userId],
  );

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
