import { useEffect, useRef } from 'react';
import { clearPageContext, setPageContext } from '@/shared/model/page-context-store';
import type { PageContext } from '@/shared/model/page-context-store';

export function useRegisterPageContext(ctx: PageContext): void {
  const serialized = JSON.stringify(ctx);
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevRef.current === serialized) return;
    prevRef.current = serialized;
    setPageContext(ctx);
  }, [serialized, ctx]);

  useEffect(() => {
    return () => {
      clearPageContext();
    };
  }, []);
}
