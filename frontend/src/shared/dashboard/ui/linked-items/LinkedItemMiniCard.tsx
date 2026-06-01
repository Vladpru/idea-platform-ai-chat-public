import { Link } from '@tanstack/react-router';
import { type RefObject } from 'react';

import { COMPACT_CARD_COLUMN_THRESHOLD } from '@/shared/dashboard/lib/config/constants';
import type { DashboardLinkedItem } from '@/shared/dashboard/model/dashboard.types';
import { DashboardCardStats } from '@/shared/dashboard/ui/cards/DashboardCardStats';
import { getSuppressClickAfterDragLinkProps } from '@/shared/hooks/use-horizontal-drag-scroll';
import { cn } from '@/shared/lib/utils';

type LinkedItemMiniCardProps = {
  item: DashboardLinkedItem;
  detailHref: string;
  entityType: 'IDEA' | 'PROBLEM';
  columnCount?: number;
  emptyImageText?: string;
  suppressClickRef?: RefObject<boolean>;
};

export function LinkedItemMiniCard({
  item,
  detailHref,
  entityType,
  columnCount = 1,
  emptyImageText = 'No image',
  suppressClickRef,
}: LinkedItemMiniCardProps) {
  const narrow = columnCount >= COMPACT_CARD_COLUMN_THRESHOLD;
  const showImageCard =
    entityType === 'PROBLEM' && item.imageUrl !== null && !narrow;
  const suppressNavigationProps =
    getSuppressClickAfterDragLinkProps(suppressClickRef);

  if (showImageCard) {
    return (
      <Link
        to={detailHref}
        draggable={false}
        {...suppressNavigationProps}
        className={cn(
          'border-brand-gray-200 hover:border-brand-dark-blue group/linked-item flex shrink-0 flex-col overflow-hidden rounded-lg border bg-white transition-all hover:shadow-md',
          narrow ? 'w-[120px]' : 'w-[200px] sm:w-[210px]',
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

        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            narrow ? 'gap-1 p-2' : 'gap-2 p-2.5 sm:p-3',
          )}
        >
          <p
            className={cn(
              'text-brand-black line-clamp-2 leading-snug font-bold',
              narrow ? 'text-[11px]' : 'text-sm',
            )}
          >
            {item.title}
          </p>
          {!narrow ? (
            <DashboardCardStats
              stats={item.stats}
              iconClassName="size-3.5"
              className="gap-2.5 text-[11px] sm:text-xs"
            />
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={detailHref}
      draggable={false}
      {...suppressNavigationProps}
      className={cn(
        'border-brand-gray-200 hover:border-brand-dark-blue focus-visible:ring-brand-dark-blue flex shrink-0 items-center rounded-lg border bg-white transition-colors hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        narrow ? 'w-[140px] px-2.5 py-1.5' : 'w-[260px] px-4 py-2',
      )}
    >
      <p
        className={cn(
          'text-brand-black line-clamp-2 w-full leading-snug font-bold tracking-wide',
          narrow ? 'text-[11px]' : 'text-base',
        )}
      >
        {item.title}
      </p>
    </Link>
  );
}
