import { fetchIdeasDashboard } from '@/features/ideas/api/ideas.api';
import type {
  IdeasDashboardTab,
  IdeasFeedResponse,
} from '@/features/ideas/api/ideas-api.types';
import { toIdeaDashboardCard } from '@/features/ideas-dashboard/model/ideas-dashboard.mapper';
import type { IdeaDashboardCard } from '@/features/ideas-dashboard/model/ideas-dashboard.types';
import {
  useInfiniteQuery,
  type InfiniteData,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';

const MY_IDEAS_DASHBOARD_PAGE_SIZE = 20;

export const myIdeasDashboardKeys = {
  all: ['my-ideas-dashboard'] as const,
  tab: (tab: IdeasDashboardTab) => [...myIdeasDashboardKeys.all, tab] as const,
};

function selectCards(data: InfiniteData<IdeasFeedResponse>): {
  items: IdeaDashboardCard[];
  totals: { published: number; drafts: number; joined: number } | undefined;
} {
  const items = data.pages.flatMap(page => page.data.map(toIdeaDashboardCard));
  const totals = data.pages[0]?.meta.totals;
  return { items, totals };
}

export function useMyIdeasDashboard() {
  const search = useSearch({ from: '/_auth/profile/ideas' });
  const navigate = useNavigate();
  const tab: IdeasDashboardTab = search.tab ?? 'published';

  const setTab = useCallback(
    (nextTab: IdeasDashboardTab) => {
      void navigate({
        to: '.',
        search: { tab: nextTab },
      });
    },
    [navigate],
  );

  const query = useInfiniteQuery({
    queryKey: myIdeasDashboardKeys.tab(tab),
    queryFn: ({ pageParam }) =>
      fetchIdeasDashboard({
        tab,
        limit: MY_IDEAS_DASHBOARD_PAGE_SIZE,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    select: selectCards,
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

/** Call this from any mutation that alters the user's ideas/joined list. */
export function useInvalidateMyIdeasDashboard() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: myIdeasDashboardKeys.all });
  }, [queryClient]);
}
