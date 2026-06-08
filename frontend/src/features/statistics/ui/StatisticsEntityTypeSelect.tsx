import { cn } from '@/shared/lib/utils';

import type { StatisticsEntityType } from '../model/statistics.types';

const ENTITY_TYPE_OPTIONS: { value: StatisticsEntityType; label: string }[] = [
  { value: 'idea', label: 'Ideas' },
  { value: 'problem', label: 'Problems' },
];

type StatisticsEntityTypeSelectProps = {
  value: StatisticsEntityType;
  onChange: (entityType: StatisticsEntityType) => void;
};

export function StatisticsEntityTypeSelect({
  value,
  onChange,
}: StatisticsEntityTypeSelectProps) {
  return (
    <div
      className="border-brand-gray-200 bg-card inline-flex rounded-md border p-1"
      role="group"
      aria-label="Statistics entity type"
    >
      {ENTITY_TYPE_OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          className={cn(
            'cursor-pointer rounded px-4 py-2 text-sm font-semibold transition-colors',
            option.value === value
              ? 'bg-brand-dark-blue text-white'
              : 'text-brand-gray-600 hover:text-brand-dark-blue',
          )}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
