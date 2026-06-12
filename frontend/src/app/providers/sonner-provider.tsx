import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

export function SonnerProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" theme="light" />
    </>
  );
}
