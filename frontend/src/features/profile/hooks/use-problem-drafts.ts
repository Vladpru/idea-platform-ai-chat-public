import { fetchProblemsDashboard } from '@/features/problems/api/problems.api';
import type { ProblemsFeedResponse } from '@/features/problems/api/problems-api.types';
import { toProblemDashboardCard } from '@/features/problems-dashboard/model/problems-dashboard.mapper';
import type { ProblemDashboardCard } from '@/features/problems-dashboard/model/problems-dashboard.types';
import {
  keepPreviousData,
  type InfiniteData,
  useInfiniteQuery,
} from '@tanstack/react-query';

const PAGE_SIZE = 20;

const problemDraftsKeys = {
  all: ['problem-drafts'] as const,
};

function selectCards(data: InfiniteData<ProblemsFeedResponse>): ProblemDashboardCard[] {
  return data.pages.flatMap(page => page.data.map(dto => toProblemDashboardCard(dto)));
}

export function useProblemDrafts() {
  const query = useInfiniteQuery({
    queryKey: problemDraftsKeys.all,
    queryFn: ({ pageParam }) =>
      fetchProblemsDashboard({ tab: 'drafts', limit: PAGE_SIZE, page: pageParam as number }),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    select: selectCards,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
