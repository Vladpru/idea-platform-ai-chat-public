import { fetchIdeasDashboard } from '@/features/ideas/api/ideas.api';
import type { IdeasFeedResponse } from '@/features/ideas/api/ideas-api.types';
import { toIdeaDashboardCard } from '@/features/ideas-dashboard/model/ideas-dashboard.mapper';
import type { IdeaDashboardCard } from '@/features/ideas-dashboard/model/ideas-dashboard.types';
import {
  keepPreviousData,
  type InfiniteData,
  useInfiniteQuery,
} from '@tanstack/react-query';

const PAGE_SIZE = 20;

const ideaDraftsKeys = {
  all: ['idea-drafts'] as const,
};

function selectCards(data: InfiniteData<IdeasFeedResponse>): IdeaDashboardCard[] {
  return data.pages.flatMap(page => page.data.map(toIdeaDashboardCard));
}

export function useIdeaDrafts() {
  const query = useInfiniteQuery({
    queryKey: ideaDraftsKeys.all,
    queryFn: ({ pageParam }) =>
      fetchIdeasDashboard({ tab: 'drafts', limit: PAGE_SIZE, page: pageParam as number }),
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
