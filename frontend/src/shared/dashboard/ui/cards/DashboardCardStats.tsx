'use client';

import commentsIcon from '@/assets/svg/comments.svg';
import likeIcon from '@/assets/svg/like.svg';
import viewsIcon from '@/assets/svg/views.svg';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { StatIcon } from '@/shared/ui/icons/stat-icon';
import { LikeButton } from '@/shared/ui/LikeButton';

import type { DashboardEngagementStats } from '@/shared/dashboard/model/dashboard.types';

type DashboardCardStatsProps = {
  stats: DashboardEngagementStats;
  entityId?: string;
  entityType?: 'IDEA' | 'PROBLEM';
  isLiked?: boolean;
  likeButton?: ReactNode;
  className?: string;
  iconClassName?: string;
};

export function DashboardCardStats({
  stats,
  entityId,
  entityType,
  isLiked,
  likeButton,
  className,
  iconClassName = 'size-3.5',
}: DashboardCardStatsProps) {
  return (
    <div
      className={cn(
        'text-brand-dark-blue relative z-10 flex shrink-0 items-center gap-3 text-xs font-normal',
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

      {likeButton ??
        (entityId && entityType ? (
          <LikeButton
            entityId={entityId}
            entityType={entityType}
            isLiked={isLiked ?? false}
            likeCount={stats.likes}
            className="cursor-pointer px-0 py-0 text-xs font-normal hover:bg-transparent"
            iconClassName={iconClassName}
          />
        ) : (
          <span className="inline-flex items-center gap-1">
            <StatIcon src={likeIcon} className={iconClassName} />
            <span className="tabular-nums">{stats.likes}</span>
          </span>
        ))}
    </div>
  );
}
