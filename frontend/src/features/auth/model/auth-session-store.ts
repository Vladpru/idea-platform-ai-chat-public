import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clearStoredAuthToken, setStoredAuthToken } from "@/shared/lib/auth-token";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
};

type AuthSessionState = {
  user: SessionUser | null;
  accessToken: string | null;
  setSession: (apiUser: unknown, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

function parseSessionUser(raw: unknown): SessionUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.id !== "string" || typeof u.email !== "string") return null;
  const realName = typeof u.realName === "string" ? u.realName : null;
  const avatarUrl = typeof u.avatarUrl === "string" ? u.avatarUrl : null;
  const email = u.email;
  const name =
    realName?.trim() ||
    (typeof email === "string" ? email.split("@")[0] : "") ||
    "User";
  return {
    id: u.id,
    email,
    name,
    picture: avatarUrl,
  };
}

export const useAuthSessionStore = create<AuthSessionState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: (apiUser, accessToken) => {
        const user = parseSessionUser(apiUser);
        set({ user, accessToken });
        setStoredAuthToken(accessToken);
      },
      setAccessToken: (accessToken) => {
        set({ accessToken });
        setStoredAuthToken(accessToken);
      },
      clearSession: () => {
        clearStoredAuthToken();
        set({ user: null, accessToken: null });
        void useAuthSessionStore.persist.clearStorage();
      },
    }),
    {
      name: "auth-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setStoredAuthToken(state.accessToken);
      },
    },
  ),
);

export function nameInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toUpperCase();
}
