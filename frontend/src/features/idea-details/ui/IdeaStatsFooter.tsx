import commentsIcon from '@/assets/svg/comments.svg';
import likeIcon from '@/assets/svg/like.svg';
import viewsIcon from '@/assets/svg/views.svg';
import { formatIdeaDate } from '@/features/idea-details/lib/format-idea-date';
import type { IdeaDetailsStats } from '@/features/idea-details/model/idea-details.types';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { StatIcon } from '@/shared/ui/icons/stat-icon';

type IdeaStatsFooterProps = {
  createdAt: string;
  stats: IdeaDetailsStats;
  className?: string;
};

type StatItemProps = {
  icon: ReactNode;
  value: number;
  label: string;
};

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <span className="text-brand-gray-600 inline-flex items-center gap-1.5 text-sm">
      <span className="text-brand-gray-500" aria-hidden>
        {icon}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function IdeaStatsFooter({
  createdAt,
  stats,
  className,
}: IdeaStatsFooterProps) {
  return (
    <footer
      className={cn(
        'border-brand-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <h3 className="text-brand-gray-600 font-regular font-arial text-sm">
          Created:
        </h3>
        <time
          dateTime={createdAt}
          className="text-brand-gray-600 font-regular font-arial text-sm"
        >
          {formatIdeaDate(createdAt)}
        </time>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <StatItem
          icon={<StatIcon src={viewsIcon} className="size-4" />}
          value={stats.views}
          label="views"
        />
        <StatItem
          icon={<StatIcon src={commentsIcon} className="size-4" />}
          value={stats.comments}
          label="comments"
        />
        <StatItem
          icon={<StatIcon src={likeIcon} className="size-4" />}
          value={stats.likes}
          label="likes"
        />
      </div>
    </footer>
  );
}
