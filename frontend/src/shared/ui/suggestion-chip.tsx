import { Check, Plus } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/utils';

export type SuggestionChipProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children'
> & {
  label: string;
  selected?: boolean;
  tier?: 'strong' | 'suggested' | 'speculative';
};

export function SuggestionChip({
  label,
  selected = false,
  tier = 'suggested',
  className,
  type = 'button',
  title,
  ...props
}: SuggestionChipProps) {
  const Icon = selected ? Check : Plus;
  const resolvedTitle =
    title ?? (tier === 'speculative' ? 'New tag' : undefined);

  return (
    <button
      type={type}
      aria-pressed={selected}
      title={resolvedTitle}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-0.5 text-sm font-normal transition-colors',
        'focus-visible:ring-brand-dark-blue focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'bg-brand-light-blue/40 text-brand-gray-600 hover:bg-brand-light-blue/55 border-transparent'
          : tier === 'strong'
            ? 'border-brand-dark-blue/30 bg-brand-light-blue/35 text-brand-gray-800 hover:bg-brand-light-blue/50'
            : tier === 'speculative'
              ? 'border-brand-gray-300 bg-brand-gray-100 text-brand-gray-500 hover:bg-brand-gray-100/80'
              : 'bg-brand-gray-200 text-brand-gray-600 hover:bg-brand-gray-200/80 border-transparent',
        className,
      )}
      {...props}
    >
      <Icon className="fill size-3.5 shrink-0 stroke-[1.5]" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}
