import { fetchProfileContributions } from '@/features/profile/api/profile.api';
import type {
  ProfileContribution,
  ProfileContributionsTab,
} from '@/features/profile/model/profile-contributions.types';
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

const PROFILE_CONTRIBUTIONS_PAGE_SIZE = 20;

export const profileContributionsKeys = {
  all: ['profile-contributions'] as const,
  list: (profileId: string, tab: ProfileContributionsTab) =>
    [...profileContributionsKeys.all, profileId, tab] as const,
};

export function useProfileContributions(
  profileId: string,
  tab: ProfileContributionsTab = 'all',
) {
  const query = useInfiniteQuery({
    queryKey: profileContributionsKeys.list(profileId, tab),
    queryFn: ({ pageParam }) =>
      fetchProfileContributions({
        profileId,
        skip: pageParam as number,
        take: PROFILE_CONTRIBUTIONS_PAGE_SIZE,
        tab,
      }),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    getNextPageParam: lastPage => {
      const nextSkip = lastPage.meta.skip + lastPage.meta.take;
      return nextSkip < lastPage.meta.total ? nextSkip : undefined;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const items: ProfileContribution[] =
    query.data?.pages.flatMap(page => page.data) ?? [];
  const total = query.data?.pages[0]?.meta.total;

  return {
    tab,
    items,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

export function useInvalidateProfileContributions() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: profileContributionsKeys.all,
    });
  }, [queryClient]);
}
