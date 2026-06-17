import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  clearStoredAuthToken,
  setStoredAuthToken,
} from '@/shared/lib/auth-token';
import { clearAuthenticatedQueryCache } from '@/shared/lib/query-client';
import { extractThemePreference } from '@/shared/lib/theme-storage';
import { formatUserDisplayName } from '@/shared/lib/user-display';
import type { ThemePreference } from '@/features/profile/api/profile.api';

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  picture: string | null;
  themePreference: ThemePreference;
};

type AuthSessionState = {
  user: SessionUser | null;
  accessToken: string | null;
  setSession: (apiUser: unknown, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

function parseSessionUser(raw: unknown): SessionUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;

  if (typeof u.id !== 'string' || typeof u.email !== 'string') return null;

  const firstName = typeof u.firstName === 'string' ? u.firstName : '';
  const lastName = typeof u.lastName === 'string' ? u.lastName : '';
  const avatarUrl =
    typeof u.avatarUrl === 'string' && u.avatarUrl.trim().length > 0
      ? u.avatarUrl
      : null;
  const email = u.email;

  const name = formatUserDisplayName({ firstName, lastName, email });
  const themePreference = extractThemePreference(raw) ?? 'SYSTEM';

  return {
    id: u.id,
    email,
    firstName,
    lastName,
    name,
    picture: avatarUrl,
    themePreference,
  };
}

type StoreSetter = (partial: Partial<AuthSessionState>) => void;
let _set: StoreSetter = () => {};

export const useAuthSessionStore = create<AuthSessionState>()(
  persist(
    set => {
      _set = set;
      return {
        user: null,
        accessToken: null,
        setSession: (apiUser, accessToken) => {
          const user = parseSessionUser(apiUser);
          if (!user) {
            clearStoredAuthToken();
            set({ user: null, accessToken: null });
            return;
          }
          set({ user, accessToken });
          setStoredAuthToken(accessToken);
        },
        setAccessToken: accessToken => {
          set({ accessToken });
          setStoredAuthToken(accessToken);
        },
        clearSession: () => {
          clearStoredAuthToken();
          clearAuthenticatedQueryCache();
          set({ user: null, accessToken: null });
          void useAuthSessionStore.persist.clearStorage();
        },
      };
    },
    {
      name: 'auth-session',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => state => {
        if (state?.accessToken && state.user?.id) {
          setStoredAuthToken(state.accessToken);
        } else if (state) {
          clearStoredAuthToken();
          _set({ user: null, accessToken: null });
        }
      },
    },
  ),
);

export function hasValidSession(): boolean {
  const { accessToken, user } = useAuthSessionStore.getState();
  return Boolean(accessToken && user?.id);
}

export function nameInitial(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  return t.charAt(0).toUpperCase();
}
