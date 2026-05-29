import { Activity, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { Card } from '@/shared/ui';
import { Button } from '@/shared/ui/button';

import { useStatisticsSnapshot } from '../hooks/use-statistics-snapshot';
import type { StatisticsPeriod } from '../model/statistics.types';
import { NewIdeasChartCard } from './NewIdeasChartCard';
import { StatMetricCard } from './StatMetricCard';
import { StatusChangesCard } from './StatusChangesCard';
import { TopContributorsCard } from './TopContributorsCard';
import { statisticsPageTitleClass } from './statistics-classes';

function StatisticsGridSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4 lg:mt-8 lg:gap-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-5">
        <div className="border-brand-gray-200 h-72 animate-pulse rounded-lg border bg-white lg:col-span-3" />
        <div className="border-brand-gray-200 h-72 animate-pulse rounded-lg border bg-white lg:col-span-1" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
        <div className="border-brand-gray-200 h-40 animate-pulse rounded-lg border bg-white" />
        <div className="border-brand-gray-200 h-40 animate-pulse rounded-lg border bg-white" />
        <div className="border-brand-gray-200 h-40 animate-pulse rounded-lg border bg-white" />
      </div>
    </div>
  );
}

export function StatisticsDashboardPage() {
  const [period, setPeriod] = useState<StatisticsPeriod>('week');
  const { data, isLoading, isError, error, refetch, isFetching } =
    useStatisticsSnapshot(period);

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl 2xl:max-w-6xl">
        <Card className="text-card-foreground min-h-[calc(100vh-56px)] rounded-none bg-white p-6 md:p-10">
          <h1 className={statisticsPageTitleClass}>Statistics</h1>

          {isLoading ? (
            <StatisticsGridSkeleton />
          ) : isError || !data ? (
            <div className="mt-8 rounded-lg border border-red-200 bg-white p-6 text-center">
              <p className="text-brand-gray-700 text-sm">
                {getApiErrorMessage(error) || 'Failed to load statistics.'}
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
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 items-stretch gap-4 lg:mt-8 lg:grid-cols-7 lg:gap-5">
                <div className="flex min-w-0 lg:col-span-5">
                  <NewIdeasChartCard
                    period={period}
                    onPeriodChange={setPeriod}
                    newIdeasTotal={data.newIdeasTotal}
                    newIdeasSeries={data.newIdeasSeries}
                    isFetching={isFetching}
                  />
                </div>
                <div className="flex min-w-0 lg:col-span-2">
                  <StatusChangesCard statusChanges={data.statusChanges} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 lg:mt-5 lg:gap-5">
                <StatMetricCard
                  title="Users"
                  icon={UserPlus}
                  metrics={data.users}
                />
                <StatMetricCard
                  title="Activity"
                  icon={Activity}
                  metrics={data.activity}
                />
                <TopContributorsCard contributors={data.topContributors} />
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
