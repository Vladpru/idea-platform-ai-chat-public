import { Link } from '@tanstack/react-router';

import { cn } from '@/shared/lib/utils';

import type { DashboardLinkedItem } from '../model/dashboard.types';
import { DashboardCardStats } from './DashboardCardStats';

type LinkedItemMiniCardProps = {
  item: DashboardLinkedItem;
  detailHref: string;
  compact?: boolean;
  emptyImageText?: string;
};

export function LinkedItemMiniCard({
  item,
  detailHref,
  compact = false,
  emptyImageText = 'No image',
}: LinkedItemMiniCardProps) {
  return (
    <Link
      to={detailHref}
      className={cn(
        'border-brand-gray-200 hover:border-brand-dark-blue group/linked-item flex shrink-0 flex-col overflow-hidden rounded-lg border bg-white transition-all hover:shadow-md',
        compact ? 'w-[168px]' : 'w-[200px] sm:w-[210px]',
      )}
    >
      <div className="bg-brand-gray-100 aspect-16/10 w-full shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover/linked-item:scale-[1.03]"
          />
        ) : (
          <div className="text-brand-gray-400 flex size-full items-center justify-center text-[10px] font-semibold uppercase">
            {emptyImageText}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5 sm:p-3">
        <p
          className={cn(
            'text-brand-black line-clamp-2 leading-snug font-bold',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {item.title}
        </p>
        <DashboardCardStats
          stats={item.stats}
          iconClassName={compact ? 'size-3' : 'size-3.5'}
          className="gap-2.5 text-[11px] sm:text-xs"
        />
      </div>
    </Link>
  );
}
