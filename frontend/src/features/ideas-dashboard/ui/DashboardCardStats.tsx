import { Eye, Heart, MessageCircle } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import type { DashboardEngagementStats } from '../model/dashboard.types';

type DashboardCardStatsProps = {
  stats: DashboardEngagementStats;
  className?: string;
  iconClassName?: string;
};

export function DashboardCardStats({
  stats,
  className,
  iconClassName = 'size-3.5',
}: DashboardCardStatsProps) {
  return (
    <div
      className={cn(
        'text-brand-gray-600 flex shrink-0 items-center gap-3 text-xs',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <Eye className={cn('text-brand-gray-400', iconClassName)} aria-hidden />
        <span className="font-semibold tabular-nums">{stats.views}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageCircle
          className={cn('text-brand-gray-400', iconClassName)}
          aria-hidden
        />
        <span className="font-semibold tabular-nums">{stats.comments}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart
          className={cn('text-brand-gray-400', iconClassName)}
          aria-hidden
        />
        <span className="font-semibold tabular-nums">{stats.likes}</span>
      </span>
    </div>
  );
}
