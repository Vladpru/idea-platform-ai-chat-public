import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { getInitials } from '@/features/idea-details/lib/get-initials';
import { User } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

import { formatContributorPoints } from '../../lib/format-statistics-values';
import { getScoreCategoryIcon } from '../../lib/score-category-icons';
import type { MyScore } from '../../model/statistics.types';
import { StatisticsHowItWorksLink } from '../StatisticsHowItWorksLink';
import {
  statisticsCardClass,
  statisticsIconTileClass,
} from '../statistics-classes';

type MyScoreCardProps = {
  myScore: MyScore;
  isFetching?: boolean;
};

export function MyScoreCard({ myScore, isFetching = false }: MyScoreCardProps) {
  const user = useAuthSessionStore(state => state.user);
  const displayName = user?.name ?? 'Your score';

  return (
    <section
      className={cn(
        `${statisticsCardClass} w-full`,
        isFetching && 'opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={statisticsIconTileClass}>
            <User className="size-5" aria-hidden />
          </span>
          <h2 className="text-brand-dark-blue text-lg font-bold">My score</h2>
        </div>
        <StatisticsHowItWorksLink />
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <Avatar size="lg" className="size-16">
          {user?.picture ? (
            <AvatarImage src={user.picture} alt={displayName} />
          ) : null}
          <AvatarFallback className="bg-brand-light-blue text-brand-dark-blue text-base font-semibold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <p className="text-brand-black mt-3 text-base font-bold">
          {displayName}
        </p>
        <span className="bg-brand-light-blue text-brand-dark-blue mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold tabular-nums">
          {formatContributorPoints(myScore.totalPoints)}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {myScore.categories.map(category => {
          const Icon = getScoreCategoryIcon(category.key);

          return (
            <article
              key={category.key}
              className="border-brand-gray-200 bg-brand-gray-50 flex flex-col items-center rounded-lg border px-3 py-5 text-center"
            >
              <span className="bg-brand-dark-blue flex size-9 items-center justify-center rounded-full text-white">
                <Icon className="size-4" aria-hidden />
              </span>
              <p className="text-brand-dark-blue mt-4 text-2xl font-bold tabular-nums">
                {category.points}
              </p>
              <p className="text-brand-gray-500 text-xs font-semibold">
                points
              </p>
              <p className="text-brand-gray-700 mt-3 text-sm font-semibold">
                {category.countLabel}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
