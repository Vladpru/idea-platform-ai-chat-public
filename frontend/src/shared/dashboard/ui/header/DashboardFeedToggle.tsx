import { cn } from '@/shared/lib/utils';

type DashboardFeedToggleProps = {
  feedOnly: boolean;
  onFeedOnlyChange: (feedOnly: boolean) => void;
  className?: string;
};

const feedToggleButtonClass =
  'cursor-pointer text-xs font-bold tracking-wide uppercase transition-colors';

export function DashboardFeedToggle({
  feedOnly,
  onFeedOnlyChange,
  className,
}: DashboardFeedToggleProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <button
        type="button"
        onClick={() => onFeedOnlyChange(true)}
        className={cn(
          feedToggleButtonClass,
          feedOnly
            ? 'text-brand-dark-blue'
            : 'text-brand-gray-500 hover:text-brand-dark-blue',
        )}
      >
        Following
      </button>
      <button
        type="button"
        onClick={() => onFeedOnlyChange(false)}
        className={cn(
          feedToggleButtonClass,
          !feedOnly
            ? 'text-brand-dark-blue'
            : 'text-brand-gray-500 hover:text-brand-dark-blue',
        )}
      >
        All
      </button>
    </div>
  );
}
