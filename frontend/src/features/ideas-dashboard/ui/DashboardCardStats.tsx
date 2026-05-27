import commentsIcon from '@/assets/svg/comments.svg';
import likeIcon from '@/assets/svg/like.svg';
import viewsIcon from '@/assets/svg/views.svg';

import { cn } from '@/shared/lib/utils';
import { StatIcon } from '@/shared/ui/icons/stat-icon';

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
        'text-brand-dark-blue flex shrink-0 items-center gap-3 text-xs font-normal',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <StatIcon src={viewsIcon} className={iconClassName} />
        <span className="tabular-nums">{stats.views}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <StatIcon src={commentsIcon} className={iconClassName} />
        <span className="tabular-nums">{stats.comments}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <StatIcon src={likeIcon} className={iconClassName} />
        <span className="tabular-nums">{stats.likes}</span>
      </span>
    </div>
  );
}
