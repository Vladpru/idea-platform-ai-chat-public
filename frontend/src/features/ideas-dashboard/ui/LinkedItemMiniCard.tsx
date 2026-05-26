import { Link } from '@tanstack/react-router';

import { cn } from '@/shared/lib/utils';

import type { DashboardLinkedItem } from '../model/dashboard.types';

import { DashboardCardStats } from './DashboardCardStats';

type LinkedItemMiniCardProps = {
  item: DashboardLinkedItem;
  detailHref: string;
  compact?: boolean;
};

export function LinkedItemMiniCard({
  item,
  detailHref,
  compact = false,
}: LinkedItemMiniCardProps) {
  return (
    <Link
      to={detailHref}
      className={cn(
        'border-brand-gray-200 hover:border-brand-dark-blue flex min-w-0 shrink-0 items-center gap-2 rounded-md border bg-white p-2 transition-colors hover:shadow-sm',
        compact ? 'w-[200px]' : 'w-[240px] sm:w-[260px]',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          className={cn(
            'line-clamp-2 font-bold tracking-wide text-black',
            compact ? 'leading-tight' : 'text-xs',
          )}
        >
          {item.title}
        </p>
        <DashboardCardStats
          stats={item.stats}
          iconClassName={compact ? 'size-3' : 'size-3.5'}
          className="gap-2 text-[10px]"
        />
      </div>
    </Link>
  );
}
