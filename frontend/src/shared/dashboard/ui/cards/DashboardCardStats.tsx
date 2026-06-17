'use client';

import { CommentsIcon } from '@/assets/svg/comments';
import { LikeIcon } from '@/assets/svg/like';
import { ViewsIcon } from '@/assets/svg/views';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { LikeButton } from '@/shared/ui/LikeButton';

import type { DashboardEngagementStats } from '@/shared/dashboard/model/dashboard.types';

function getDiscussionHref(
  entityId: string,
  entityType: 'IDEA' | 'PROBLEM',
): string {
  return entityType === 'IDEA'
    ? ROUTES.ideaDetail(entityId)
    : ROUTES.problemDetail(entityId);
}

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
        <ViewsIcon className={iconClassName} />
        <span className="tabular-nums">{stats.views}</span>
      </span>

      {entityId && entityType ? (
        <Link
          to={getDiscussionHref(entityId, entityType)}
          search={{ tab: 'discussion' }}
          className="hover:text-brand-dark-blue/80 inline-flex items-center gap-1 transition-colors"
          aria-label={`View discussion (${stats.comments} comments)`}
          onClick={event => {
            event.stopPropagation();
          }}
        >
          <CommentsIcon className={iconClassName} />
          <span className="tabular-nums">{stats.comments}</span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1">
          <CommentsIcon className={iconClassName} />
          <span className="tabular-nums">{stats.comments}</span>
        </span>
      )}

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
            <LikeIcon className={iconClassName} />
            <span className="tabular-nums">{stats.likes}</span>
          </span>
        ))}
    </div>
  );
}
