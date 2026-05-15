import { type ReactNode, useEffect } from 'react';

import { useThemeStore } from '@/shared/lib/theme-store';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore(s => s.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (currentTheme: string) => {
      root.classList.remove('light', 'dark');
      if (currentTheme === 'system') {
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      } else {
        root.classList.add(currentTheme);
      }
    };

    applyTheme(theme);

    const handleSystemThemeChange = () => {
      if (theme === 'system') applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () =>
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  return children;
}
