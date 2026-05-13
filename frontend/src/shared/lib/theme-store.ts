import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export type Theme = "dark" | "light" | "system";

const STORAGE_KEY = "ui-theme";

const storage: StateStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (raw == null) return null;
    if (raw.startsWith("{")) return raw;
    if (raw === "dark" || raw === "light" || raw === "system") {
      return JSON.stringify({ state: { theme: raw as Theme }, version: 0 });
    }
    return null;
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

type ThemeState = {
  theme: Theme;
  setTheme: (next: Theme) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (next) => set({ theme: next }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => storage),
    },
  ),
);

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return { theme, setTheme };
}
