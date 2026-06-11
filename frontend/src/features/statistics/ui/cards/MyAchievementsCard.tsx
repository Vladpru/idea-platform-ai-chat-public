import { Award } from 'lucide-react';

import { AchievementGrid, useMyAchievements } from '@/features/achievements';
import { cn } from '@/shared/lib/utils';
import { SkeletonCard } from '@/shared/ui/skeleton';

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
  const { data: achievements, isLoading } = useMyAchievements();

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

      <div className="mt-6">
        {isLoading ? (
          <SkeletonCard className="h-32" />
        ) : achievements && achievements.length > 0 ? (
          <AchievementGrid achievements={achievements} />
        ) : (
          <p className="text-brand-gray-500 text-sm">No achievements yet.</p>
        )}
      </div>
    </section>
  );
}
