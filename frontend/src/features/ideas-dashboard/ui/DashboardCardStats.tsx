'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import commentsIcon from '@/assets/svg/comments.svg';
import likeIcon from '@/assets/svg/like.svg';
import viewsIcon from '@/assets/svg/views.svg';

import { api } from '@/shared/api/http';
import { syncLikeQueryCache } from '@/shared/lib/sync-like-query-cache';
import { cn } from '@/shared/lib/utils';
import { StatIcon } from '@/shared/ui/icons/stat-icon';
import { LikeButton } from '@/shared/ui/LikeButton';

import type { DashboardEngagementStats } from '../model/dashboard.types';

type DashboardCardStatsProps = {
  stats: DashboardEngagementStats;
  entityId?: string;
  entityType?: 'IDEA' | 'PROBLEM';
  isLiked?: boolean;
  className?: string;
  iconClassName?: string;
};

export function DashboardCardStats({
  stats,
  entityId,
  entityType,
  isLiked,
  className,
  iconClassName = 'size-3.5',
}: DashboardCardStatsProps) {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async ({
      id,
      type,
    }: {
      id: string;
      type: 'IDEA' | 'PROBLEM';
      nextState: { isLiked: boolean; likeCount: number };
    }) => {
      const endpoint =
        type === 'IDEA' ? `/ideas/${id}/like` : `/problems/${id}/like`;
      await api.post(endpoint);
    },
    onSuccess: (_, variables) => {
      syncLikeQueryCache(
        queryClient,
        variables.type,
        variables.id,
        variables.nextState,
      );
    },
  });

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

      {entityId && entityType ? (
        <LikeButton
          entityId={entityId}
          initialIsLiked={isLiked ?? false}
          initialLikeCount={stats.likes}
          className="cursor-pointer px-0 py-0 text-xs font-normal hover:bg-transparent"
          iconClassName={iconClassName}
          onLikeToggle={async (id, nextState) => {
            await mutateAsync({ id, type: entityType, nextState });
          }}
        />
      ) : (
        <span className="inline-flex items-center gap-1">
          <StatIcon src={likeIcon} className={iconClassName} />
          <span className="tabular-nums">{stats.likes}</span>
        </span>
      )}
    </div>
  );
}
