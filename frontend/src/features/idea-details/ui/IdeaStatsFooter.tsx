import { formatIdeaDate } from '@/features/idea-details/lib/format-idea-date';
import type { IdeaDetailsStats } from '@/features/idea-details/model/idea-details.types';
import { DashboardCardStats } from '@/features/ideas-dashboard';

import { cn } from '@/shared/lib/utils';

type IdeaStatsFooterProps = {
  createdAt: string;
  stats: IdeaDetailsStats;
  entityId: string;
  entityType: 'IDEA' | 'PROBLEM';
  isLiked: boolean;
  className?: string;
};

export function IdeaStatsFooter({
  createdAt,
  stats,
  entityId,
  entityType,
  isLiked,
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

      <DashboardCardStats
        stats={stats}
        entityId={entityId}
        entityType={entityType}
        isLiked={isLiked}
        iconClassName="size-4"
        className="text-brand-gray-600 gap-4 sm:gap-6"
      />
    </footer>
  );
}
