import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { useThemeStore } from '@/shared/lib/theme-store';

export function SonnerProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore(s => s.theme);

  return (
    <>
      {children}
      <Toaster position="bottom-left" theme={theme} richColors />
    </>
  );
}
