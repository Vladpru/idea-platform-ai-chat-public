import { Award } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import { StatisticsHowItWorksLink } from '../StatisticsHowItWorksLink';
import {
  statisticsCardClass,
  statisticsIconTileClass,
} from '../statistics-classes';

type MyAchievementsCardProps = {
  isFetching?: boolean;
};

export function MyAchievementsCard({
  isFetching = false,
}: MyAchievementsCardProps) {
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
            <Award className="size-5" aria-hidden />
          </span>
          <h2 className="text-brand-dark-blue text-lg font-bold">
            My achievements
          </h2>
        </div>
        <StatisticsHowItWorksLink />
      </div>

      <p className="text-brand-gray-500 mt-6 text-sm">
        Achievements and badges will appear here soon.
      </p>
    </section>
  );
}
