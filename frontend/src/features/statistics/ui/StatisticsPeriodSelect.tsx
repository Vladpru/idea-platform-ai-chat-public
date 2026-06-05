import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

import type { StatisticsPeriod } from '../model/statistics.types';

const PERIOD_OPTIONS: { value: StatisticsPeriod; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

type StatisticsPeriodSelectProps = {
  value: StatisticsPeriod;
  onChange: (period: StatisticsPeriod) => void;
};

export function StatisticsPeriodSelect({
  value,
  onChange,
}: StatisticsPeriodSelectProps) {
  const activeLabel =
    PERIOD_OPTIONS.find(option => option.value === value)?.label ?? 'Week';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border-brand-gray-200 text-brand-dark-blue bg-card flex min-w-[100px] cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
        >
          <span>{activeLabel}</span>
          <ChevronDown
            className="text-brand-gray-400 size-4 shrink-0"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-md p-1">
        {PERIOD_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.value}
            className={cn(
              'cursor-pointer px-3 py-2 text-sm',
              option.value === value && 'text-brand-dark-blue font-semibold',
            )}
            onSelect={() => onChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
