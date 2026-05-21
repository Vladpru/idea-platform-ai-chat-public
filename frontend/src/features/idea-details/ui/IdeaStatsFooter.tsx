import type { IdeaDetailsStats } from '@/features/idea-details/model/idea-details.types';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

import { formatIdeaDate } from '@/features/idea-details/lib/format-idea-date';

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
          icon={<Eye className="size-4" />}
          value={stats.views}
          label="views"
        />
        <StatItem
          icon={<MessageCircle className="size-4" />}
          value={stats.comments}
          label="comments"
        />
        <StatItem
          icon={<Heart className="size-4" />}
          value={stats.likes}
          label="likes"
        />
      </div>
    </footer>
  );
}
