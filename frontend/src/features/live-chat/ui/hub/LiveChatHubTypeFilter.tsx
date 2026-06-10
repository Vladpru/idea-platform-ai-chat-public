import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';
import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';

export type LiveChatHubFilter = 'all' | LiveChatEntityType;

type LiveChatHubTypeFilterProps = {
  value: LiveChatHubFilter;
  onChange: (value: LiveChatHubFilter) => void;
  counts: Record<LiveChatHubFilter, number>;
  className?: string;
};

const FILTER_OPTIONS: { id: LiveChatHubFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'users', label: 'Direct' },
  { id: 'ideas', label: 'Idea' },
  { id: 'problems', label: 'Problem' },
];

const segmentClass =
  'relative z-10 px-2.5 py-1 text-xs font-bold tracking-wide uppercase transition-colors duration-200';

const toggleSpring = { type: 'spring' as const, stiffness: 400, damping: 32 };

export function LiveChatHubTypeFilter({
  value,
  onChange,
  counts,
  className,
}: LiveChatHubTypeFilterProps) {
  const activeIndex = FILTER_OPTIONS.findIndex(option => option.id === value);

  return (
    <div
      className={cn(
        'border-brand-gray-200 bg-brand-gray-100 relative inline-grid grid-cols-4 rounded-md border p-0.5',
        className,
      )}
      role="tablist"
      aria-label="Filter live chats by type"
    >
      <motion.div
        aria-hidden
        className="bg-card pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(25%-2px)] rounded shadow-sm"
        animate={{ x: `${activeIndex * 100}%` }}
        transition={toggleSpring}
      />
      {FILTER_OPTIONS.map(option => {
        const isActive = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative cursor-pointer',
              segmentClass,
              isActive ? 'text-brand-dark-blue' : 'text-brand-gray-500',
            )}
          >
            <span>{option.label}</span>
            <span className="ml-1 tabular-nums">({counts[option.id]})</span>
          </button>
        );
      })}
    </div>
  );
}
