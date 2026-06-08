import { getInitials } from '@/features/idea-details/lib/get-initials';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Star } from 'lucide-react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

import { formatContributorPoints } from '../../lib/format-statistics-values';
import type {
  StatisticsPeriod,
  TopContributor,
} from '../../model/statistics.types';
import {
  statisticsCardClass,
  statisticsIconTileClass,
} from '../statistics-classes';

type TopContributorsCardProps = {
  contributors: TopContributor[];
  period: StatisticsPeriod;
  isFetching?: boolean;
};

function ContributorEntry({
  rank,
  contributor,
}: {
  rank: number;
  contributor: TopContributor;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="text-brand-gray-500 w-5 shrink-0 text-sm font-semibold tabular-nums">
        {rank}.
      </span>
      <Avatar size="lg" className="size-11">
        {contributor.avatarUrl ? (
          <AvatarImage src={contributor.avatarUrl} alt={contributor.name} />
        ) : null}
        <AvatarFallback className="bg-brand-light-blue text-brand-dark-blue text-sm font-semibold">
          {getInitials(contributor.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-brand-black truncate text-sm font-bold">
          {contributor.name}
        </p>
        <span className="bg-brand-light-blue text-brand-dark-blue mt-1 inline-flex rounded px-2 py-0.5 text-xs font-bold tabular-nums">
          {formatContributorPoints(contributor.points)}
        </span>
      </div>
    </li>
  );
}

export function TopContributorsCard({
  contributors,
  period,
  isFetching = false,
}: TopContributorsCardProps) {
  const leftColumn = contributors.slice(0, 3);
  const rightColumn = contributors.slice(3, 5);

  return (
    <section
      className={cn(
        `${statisticsCardClass} flex h-full w-full flex-col`,
        isFetching && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={statisticsIconTileClass}>
          <Star className="size-5" aria-hidden />
        </span>
        <h2 className="text-brand-dark-blue text-lg font-bold">
          Top contributors
        </h2>
      </div>

      {contributors.length === 0 ? (
        <p className="text-brand-gray-500 mt-6 text-sm">
          No contributor data yet.
        </p>
      ) : (
        <div className="mt-6 grid flex-1 gap-6 sm:grid-cols-2">
          <ul className="flex flex-col gap-5">
            {leftColumn.map((contributor, index) => (
              <ContributorEntry
                key={contributor.id}
                rank={index + 1}
                contributor={contributor}
              />
            ))}
          </ul>
          <ul className="flex flex-col gap-5">
            {rightColumn.map((contributor, index) => (
              <ContributorEntry
                key={contributor.id}
                rank={index + 4}
                contributor={contributor}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Link
          to={ROUTES.statisticsLeaderboard}
          search={{ period }}
          className="text-brand-dark-blue hover:text-brand-dark-blue/80 inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase transition-colors"
        >
          View full leaderboard
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
