import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

import type { StatisticsPeriod } from '../model/statistics.types';

const TIME_RANGE_OPTIONS: { value: StatisticsPeriod; label: string }[] = [
  { value: 'day', label: 'Past Day' },
  { value: 'month', label: 'Past Month' },
  { value: 'year', label: 'Past Year' },
  { value: 'year_to_date', label: 'Year to Date' },
  { value: 'all_time', label: 'All Time' },
];

type StatisticsTimeRangeSelectProps = {
  value: StatisticsPeriod;
  onChange: (period: StatisticsPeriod) => void;
};

export function StatisticsTimeRangeSelect({
  value,
  onChange,
}: StatisticsTimeRangeSelectProps) {
  const activeLabel =
    TIME_RANGE_OPTIONS.find(option => option.value === value)?.label ??
    'Year to Date';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border-brand-gray-200 text-brand-dark-blue bg-card flex min-w-[150px] cursor-pointer items-center justify-between gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
        >
          <span>{activeLabel}</span>
          <ChevronDown
            className="text-brand-gray-400 size-4 shrink-0"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-md border p-0">
        {TIME_RANGE_OPTIONS.map((option, index) => (
          <DropdownMenuItem
            key={option.value}
            className={cn(
              'cursor-pointer rounded-none px-4 py-3 text-sm font-semibold',
              index < TIME_RANGE_OPTIONS.length - 1 &&
                'border-brand-gray-200 border-b',
              option.value === value
                ? 'text-brand-dark-blue'
                : 'text-brand-dark-blue',
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
