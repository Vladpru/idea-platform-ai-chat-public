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
        'border-brand-gray-200 hover:border-brand-dark-blue group/linked-item flex min-w-0 shrink-0 items-center gap-2 rounded-md border bg-white p-2 transition-colors hover:shadow-md',
        compact ? 'w-[200px]' : 'w-[240px] sm:w-[260px]',
      )}
    >
      {item.imageUrl ? (
        <div
          className={cn(
            'bg-brand-gray-100 shrink-0 overflow-hidden rounded',
            compact ? 'size-10' : 'size-12',
          )}
        >
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover/linked-item:scale-105"
          />
        </div>
      ) : null}
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
