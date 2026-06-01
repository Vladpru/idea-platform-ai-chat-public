import { Check, Plus } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/utils';

export type SuggestionChipProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children'
> & {
  label: string;
  selected?: boolean;
};

export function SuggestionChip({
  label,
  selected = false,
  className,
  type = 'button',
  ...props
}: SuggestionChipProps) {
  const Icon = selected ? Check : Plus;

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-lg border-0 px-2 py-0.5 text-sm font-normal transition-colors',
        'focus-visible:ring-brand-dark-blue focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'bg-brand-light-blue/40 text-brand-gray-600 hover:bg-brand-light-blue/55'
          : 'bg-brand-gray-200 text-brand-gray-600 hover:bg-brand-gray-200/80',
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5 shrink-0 stroke-[1.5]" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}
