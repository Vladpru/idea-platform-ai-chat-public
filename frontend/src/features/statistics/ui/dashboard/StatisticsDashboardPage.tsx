import {
  useAchievementToast,
  useMyAchievements,
} from '@/features/achievements';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { Card } from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import { SkeletonCard } from '@/shared/ui/skeleton';

import { useStatisticsSnapshot } from '../../hooks/use-statistics-snapshot';
import { useStatisticsStore } from '../../model/statistics-store';
import { StatisticsTimeRangeSelect } from '../StatisticsTimeRangeSelect';
import { CostBenefitCard } from '../cards/CostBenefitCard';
import { MyAchievementsCard } from '../cards/MyAchievementsCard';
import { MyScoreCard } from '../cards/MyScoreCard';
import { TopContributorsCard } from '../cards/TopContributorsCard';
import { StatisticsMultiLineChartCard } from '../charts/StatisticsMultiLineChartCard';
import { statisticsPageTitleClass } from '../statistics-classes';

function StatisticsChartsSkeleton() {
  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-3 lg:gap-5">
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-5 lg:grid-cols-3 lg:gap-5">
        <SkeletonCard className="h-72 lg:col-span-2" />
        <SkeletonCard className="h-72" />
      </div>
      <SkeletonCard className="mt-4 h-96 lg:mt-5" />
      <SkeletonCard className="mt-4 h-40 lg:mt-5" />
    </>
  );
}

export function StatisticsDashboardPage() {
  const period = useStatisticsStore(s => s.period);
  const setPeriod = useStatisticsStore(s => s.setPeriod);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useStatisticsSnapshot();

  const { data: achievements } = useMyAchievements();
  useAchievementToast(achievements);

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Card className="text-card-foreground bg-card min-h-[calc(100vh-56px)] rounded-none p-6 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className={statisticsPageTitleClass}>Statistics</h1>
            <StatisticsTimeRangeSelect value={period} onChange={setPeriod} />
          </div>

          {isLoading ? (
            <StatisticsChartsSkeleton />
          ) : isError || !data ? (
            <div className="bg-card mt-8 rounded-lg border border-red-200 p-6 text-center">
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
              <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-3 lg:gap-5">
                <StatisticsMultiLineChartCard
                  title="New Ideas, Problems"
                  panel={data.charts.newEntities}
                  ariaLabel="New ideas and problems over time"
                  fillSeriesKey="ideas"
                  period={period}
                  isFetching={isFetching}
                />
                <StatisticsMultiLineChartCard
                  title="Users"
                  panel={data.charts.users}
                  ariaLabel="Users over time"
                  fillSeriesKey="newUsers"
                  period={period}
                  isFetching={isFetching}
                />
                <StatisticsMultiLineChartCard
                  title="Activity"
                  panel={data.charts.activity}
                  ariaLabel="Platform activity over time"
                  fillSeriesKey="comments"
                  period={period}
                  isFetching={isFetching}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:mt-5 lg:grid-cols-3 lg:gap-5">
                <div className="lg:col-span-2">
                  <TopContributorsCard
                    contributors={data.topContributors}
                    isFetching={isFetching}
                  />
                </div>
                <CostBenefitCard
                  total={data.costBenefitTotal}
                  isFetching={isFetching}
                />
              </div>

              <div className="mt-4 lg:mt-5">
                <MyScoreCard myScore={data.myScore} isFetching={isFetching} />
              </div>

              <div className="mt-4 lg:mt-5">
                <MyAchievementsCard isFetching={isFetching} />
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
