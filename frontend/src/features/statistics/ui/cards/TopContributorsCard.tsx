import { BadgePill } from '@/features/achievements';
import { getInitials } from '@/features/idea-details/lib/get-initials';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Star } from 'lucide-react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

import { formatContributorPoints } from '../../lib/format-statistics-values';
import type { TopContributor } from '../../model/statistics.types';
import {
  statisticsCardClass,
  statisticsIconTileClass,
} from '../statistics-classes';

type TopContributorsCardProps = {
  contributors: TopContributor[];
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
    <li>
      <Link
        to="/profile/$profileId"
        params={{ profileId: contributor.id }}
        search={{ tab: 'all' }}
        className="hover:bg-brand-gray-100 group flex items-center gap-3 rounded-lg p-1 transition-colors"
      >
        <span className="text-brand-gray-500 w-5 shrink-0 text-sm font-semibold tabular-nums">
          {rank}.
        </span>
        <Avatar
          size="lg"
          className="size-11 shrink-0 transition-transform group-hover:scale-105"
        >
          {contributor.avatarUrl ? (
            <AvatarImage src={contributor.avatarUrl} alt={contributor.name} />
          ) : null}
          <AvatarFallback className="bg-brand-light-blue text-brand-dark-blue text-sm font-semibold">
            {getInitials(contributor.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-brand-black group-hover:text-brand-dark-blue truncate text-sm font-bold transition-colors">
            {contributor.name}
          </p>
          <span className="bg-brand-light-blue text-brand-dark-blue mt-1 inline-flex rounded px-2 py-0.5 text-xs font-bold tabular-nums">
            {formatContributorPoints(contributor.points)}
          </span>
        </div>
        {contributor.achievements && contributor.achievements.length > 0 ? (
          <div className="flex shrink-0 items-center gap-1">
            {contributor.achievements
              .filter((a, i, arr) =>
                a.key !== 'top_contributor'
                  ? arr.findIndex(x => x.key === a.key) === i
                  : i === arr.findIndex(x => x.key === 'top_contributor'),
              )
              .map(badge => (
                <BadgePill
                  key={`${badge.key}-${badge.unlockedAt}`}
                  badge={badge}
                  allBadges={contributor.achievements}
                />
              ))}
          </div>
        ) : null}
      </Link>
    </li>
  );
}

export function TopContributorsCard({
  contributors,
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
          className="text-brand-dark-blue hover:text-brand-dark-blue/80 inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase transition-colors"
        >
          View full leaderboard
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
