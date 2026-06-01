import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { StarsIcon } from '@/shared/ui/icons';

type SuggestionChipGroupProps = {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
  chipsClassName?: string;
};

export function SuggestionGroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <StarsIcon />
      <p className="text-brand-gray-600 text-xs font-semibold tracking-wide uppercase">
        {children}
      </p>
    </div>
  );
}

export function SuggestionsLoadingMessage() {
  return (
    <p className="text-brand-gray-500 mt-4 text-sm">Loading suggestions…</p>
  );
}

export function SuggestionChipGroup({
  label,
  children,
  className,
  chipsClassName,
}: SuggestionChipGroupProps) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3', className)}>
      {label ? <div className="shrink-0">{label}</div> : null}
      <div className={cn('flex flex-wrap gap-2', chipsClassName)}>{children}</div>
    </div>
  );
}
