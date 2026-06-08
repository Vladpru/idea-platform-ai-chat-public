import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { Card } from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { useStatisticsLeaderboard } from '../../hooks/use-statistics-leaderboard';
import type { StatisticsPeriod } from '../../model/statistics.types';
import { StatisticsTimeRangeSelect } from '../StatisticsTimeRangeSelect';
import { statisticsPageTitleClass } from '../statistics-classes';
import { LeaderboardRow } from './LeaderboardRow';

type LeaderboardPageProps = {
  initialPeriod?: StatisticsPeriod;
};

function LeaderboardSkeleton() {
  return (
    <div className="border-brand-gray-200 mt-8 overflow-hidden rounded-lg border">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="border-brand-gray-200 flex items-center gap-4 border-b px-5 py-4 last:border-b-0 sm:px-6"
        >
          <Skeleton className="h-4 w-6" />
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardPage({
  initialPeriod = 'year_to_date',
}: LeaderboardPageProps) {
  const [period, setPeriod] = useState<StatisticsPeriod>(initialPeriod);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useStatisticsLeaderboard(period);

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Card className="text-card-foreground bg-card min-h-[calc(100vh-56px)] rounded-none p-6 md:p-10">
          <Link
            to={ROUTES.statistics}
            className="text-primary hover:text-primary/80 mb-4 inline-flex items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className={statisticsPageTitleClass}>Leaderboard</h1>
              <p className="text-brand-gray-600 mt-2 max-w-2xl text-sm">
                Top contributors ranked by total points during selected time
                frame
              </p>
            </div>
            <StatisticsTimeRangeSelect value={period} onChange={setPeriod} />
          </div>

          {isLoading ? (
            <LeaderboardSkeleton />
          ) : isError || !data ? (
            <div className="bg-card mt-8 rounded-lg border border-red-200 p-6 text-center">
              <p className="text-brand-gray-700 text-sm">
                {getApiErrorMessage(error) || 'Failed to load leaderboard.'}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          ) : data.entries.length === 0 ? (
            <p className="text-brand-gray-500 mt-8 text-sm">
              No contributor activity for this time range yet.
            </p>
          ) : (
            <ul
              className={`border-brand-gray-200 mt-8 overflow-hidden rounded-lg border ${isFetching ? 'opacity-70' : ''}`}
            >
              {data.entries.map((entry, index) => (
                <LeaderboardRow key={entry.id} rank={index + 1} entry={entry} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
