import type { Theme } from '@/app/providers/theme-context';
import type { ThemePreference } from '@/features/profile/api/profile.api';

export const AUTH_SESSION_STORAGE_KEY = 'auth-session';
export const DEFAULT_THEME_STORAGE_KEY = 'theme_default';
const LEGACY_THEME_STORAGE_KEY = 'vite-ui-theme';

const VALID_THEMES = new Set<Theme>(['light', 'dark', 'system']);

export function preferenceToTheme(
  pref: ThemePreference | undefined | null,
): Theme {
  if (pref === 'DARK') return 'dark';
  if (pref === 'SYSTEM') return 'system';
  if (pref === 'LIGHT') return 'light';
  return 'system';
}

export function themeToPreference(theme: Theme): ThemePreference {
  if (theme === 'dark') return 'DARK';
  if (theme === 'system') return 'SYSTEM';
  return 'LIGHT';
}

export function extractThemePreference(
  user: unknown,
): ThemePreference | undefined {
  if (!user || typeof user !== 'object') return undefined;
  const pref = (user as Record<string, unknown>).themePreference;
  if (pref === 'LIGHT' || pref === 'DARK' || pref === 'SYSTEM') {
    return pref;
  }
  return undefined;
}

export function getThemeStorageKey(userId?: string | null): string {
  if (userId) return `theme_${userId}`;
  return DEFAULT_THEME_STORAGE_KEY;
}

function parseStoredTheme(value: string | null): Theme | null {
  if (value && VALID_THEMES.has(value as Theme)) {
    return value as Theme;
  }
  return null;
}

function purgeLegacyThemeStorage(): void {
  localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
}

export function readGuestStoredTheme(): Theme | null {
  purgeLegacyThemeStorage();
  return parseStoredTheme(localStorage.getItem(DEFAULT_THEME_STORAGE_KEY));
}

export function readStoredTheme(userId?: string | null): Theme | null {
  if (!userId) {
    return readGuestStoredTheme();
  }
  return parseStoredTheme(localStorage.getItem(getThemeStorageKey(userId)));
}

export function writeStoredTheme(
  theme: Theme,
  userId?: string | null,
): void {
  localStorage.setItem(getThemeStorageKey(userId), theme);
}

export type RestoredAuthSession = {
  userId: string | null;
  themePreference: ThemePreference | null;
};

export function readAuthSessionFromStorage(): RestoredAuthSession {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return { userId: null, themePreference: null };
    }

    const parsed = JSON.parse(raw) as {
      state?: { user?: { id?: string } };
    };
    const user = parsed.state?.user;
    const userId = typeof user?.id === 'string' ? user.id : null;

    return {
      userId,
      themePreference: extractThemePreference(user) ?? null,
    };
  } catch {
    return { userId: null, themePreference: null };
  }
}

export function resolveActiveTheme(
  userId?: string | null,
  themePreference?: ThemePreference | null,
): Theme {
  if (userId) {
    const stored = readStoredTheme(userId);
    if (stored) return stored;
    if (themePreference) {
      return preferenceToTheme(themePreference);
    }
    return 'system';
  }

  return readGuestStoredTheme() ?? 'system';
}

export function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light';
    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}

export function initializeThemeBeforePaint(): void {
  const { userId, themePreference } = readAuthSessionFromStorage();
  applyThemeToDocument(resolveActiveTheme(userId, themePreference));
}
