import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';

type DashboardFeedToggleProps = {
  feedOnly: boolean;
  onFeedOnlyChange: (feedOnly: boolean) => void;
  className?: string;
};

const feedToggleSegmentClass =
  'relative z-10 px-2.5 py-1 font-bold tracking-wide uppercase transition-colors duration-200 text-[10px] xl:text-xs';

const feedToggleSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 32,
};

export function DashboardFeedToggle({
  feedOnly,
  onFeedOnlyChange,
  className,
}: DashboardFeedToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={feedOnly}
      aria-label={feedOnly ? 'Showing following only' : 'Showing all'}
      onClick={() => onFeedOnlyChange(!feedOnly)}
      className={cn(
        'border-brand-gray-200 bg-brand-gray-100 relative inline-grid cursor-pointer grid-cols-2 rounded-md border p-0.5',
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="bg-card pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded shadow-sm"
        animate={{ x: feedOnly ? '100%' : '0%' }}
        transition={feedToggleSpring}
      />
      <span
        className={cn(
          feedToggleSegmentClass,
          !feedOnly ? 'text-brand-dark-blue' : 'text-brand-gray-500',
        )}
      >
        All
      </span>
      <span
        className={cn(
          feedToggleSegmentClass,
          feedOnly ? 'text-brand-dark-blue' : 'text-brand-gray-500',
        )}
      >
        Following
      </span>
    </button>
  );
}
