import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { fetchIdeasDashboard } from '@/features/ideas/api/ideas.api';
import type { IdeasFeedResponse } from '@/features/ideas/api/ideas-api.types';
import { fetchProblemsDashboard } from '@/features/problems/api/problems.api';
import type { ProblemsFeedResponse } from '@/features/problems/api/problems-api.types';
import { fetchStatisticsSnapshot } from '@/features/statistics/api/statistics.api';
import { getClientTimeZone } from '@/features/statistics/lib/client-time-zone';
import { useQueries } from '@tanstack/react-query';

export const homeOverviewKeys = {
  all: ['home-overview'] as const,
  ideasTotals: () => [...homeOverviewKeys.all, 'ideas-totals'] as const,
  problemsTotals: () => [...homeOverviewKeys.all, 'problems-totals'] as const,
  statistics: (timeZone: string) =>
    [...homeOverviewKeys.all, 'statistics', 'week', timeZone] as const,
};

type DashboardTotals = {
  published: number;
  drafts: number;
  joined: number;
};

export function useHomeOverview() {
  const user = useAuthSessionStore(state => state.user);
  const timeZone = getClientTimeZone();

  const [ideasQuery, problemsQuery, statisticsQuery] = useQueries({
    queries: [
      {
        queryKey: homeOverviewKeys.ideasTotals(),
        queryFn: () =>
          fetchIdeasDashboard({ tab: 'published', page: 1, limit: 1 }),
        select: (data: IdeasFeedResponse) => data.meta.totals,
      },
      {
        queryKey: homeOverviewKeys.problemsTotals(),
        queryFn: () =>
          fetchProblemsDashboard({ tab: 'published', page: 1, limit: 1 }),
        select: (data: ProblemsFeedResponse) => data.meta.totals,
      },
      {
        queryKey: homeOverviewKeys.statistics(timeZone),
        queryFn: () => fetchStatisticsSnapshot('week', 'idea', timeZone),
      },
    ],
  });

  const isActivityLoading = ideasQuery.isLoading || problemsQuery.isLoading;
  const isStatisticsLoading = statisticsQuery.isLoading;
  const hasActivityError = ideasQuery.isError || problemsQuery.isError;
  const hasStatisticsError = statisticsQuery.isError;

  const refetch = () => {
    void ideasQuery.refetch();
    void problemsQuery.refetch();
    void statisticsQuery.refetch();
  };

  return {
    user,
    ideasTotals: ideasQuery.data as DashboardTotals | undefined,
    problemsTotals: problemsQuery.data as DashboardTotals | undefined,
    statistics: statisticsQuery.data,
    isActivityLoading,
    isStatisticsLoading,
    hasActivityError,
    hasStatisticsError,
    refetch,
  };
}
