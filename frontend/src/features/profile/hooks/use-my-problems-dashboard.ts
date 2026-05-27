import { fetchProblemsDashboard } from '@/features/problems/api/problems.api';
import type {
  ProblemsDashboardTab,
  ProblemsFeedResponse,
} from '@/features/problems/api/problems-api.types';
import { toProblemDashboardCard } from '@/features/problems-dashboard/model/problems-dashboard.mapper';
import type { ProblemDashboardCard } from '@/features/problems-dashboard/model/problems-dashboard.types';
import {
  useInfiniteQuery,
  type InfiniteData,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';

const MY_PROBLEMS_DASHBOARD_PAGE_SIZE = 20;

export const myProblemsDashboardKeys = {
  all: ['my-problems-dashboard'] as const,
  tab: (tab: ProblemsDashboardTab) =>
    [...myProblemsDashboardKeys.all, tab] as const,
};

function selectProblems(data: InfiniteData<ProblemsFeedResponse>): {
  items: ProblemDashboardCard[];
  totals: { published: number; drafts: number; joined: number } | undefined;
} {
  const items = data.pages.flatMap(page =>
    page.data.map(dto => toProblemDashboardCard(dto)),
  );
  const totals = data.pages[0]?.meta.totals;
  return { items, totals };
}

export function useMyProblemsDashboard() {
  const search = useSearch({ from: '/_auth/profile/problems' });
  const navigate = useNavigate();
  const tab: ProblemsDashboardTab = search.tab ?? 'published';

  const setTab = useCallback(
    (nextTab: ProblemsDashboardTab) => {
      void navigate({
        to: '.',
        search: { tab: nextTab },
      });
    },
    [navigate],
  );

  const query = useInfiniteQuery({
    queryKey: myProblemsDashboardKeys.tab(tab),
    queryFn: ({ pageParam }) =>
      fetchProblemsDashboard({
        tab,
        limit: MY_PROBLEMS_DASHBOARD_PAGE_SIZE,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    select: selectProblems,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    tab,
    setTab,
    items: query.data?.items ?? [],
    totals: query.data?.totals,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

export function useInvalidateMyProblemsDashboard() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: myProblemsDashboardKeys.all,
    });
  }, [queryClient]);
}
