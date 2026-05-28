import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import { myIdeasDashboardKeys } from '@/features/profile/hooks/use-my-ideas-dashboard';
import { myProblemsDashboardKeys } from '@/features/profile/hooks/use-my-problems-dashboard';

export type LikeCachePatch = {
  isLiked: boolean;
  likeCount: number;
};

type WithLikeCount = {
  id: string;
  isLiked: boolean;
  likeCount: number;
};

type WithStatsLikes = {
  id: string;
  isLiked: boolean;
  stats: { likes: number };
};

type FeedResponse<T> = {
  data: T[];
};

function patchEntityDto<T extends WithLikeCount>(
  item: T,
  entityId: string,
  patch: LikeCachePatch,
): T {
  if (item.id !== entityId) {
    return item;
  }
  return {
    ...item,
    isLiked: patch.isLiked,
    likeCount: patch.likeCount,
  };
}

function patchFeed<T extends WithLikeCount>(
  feed: FeedResponse<T>,
  entityId: string,
  patch: LikeCachePatch,
): FeedResponse<T> {
  return {
    ...feed,
    data: feed.data.map(item => patchEntityDto(item, entityId, patch)),
  };
}

function patchInfiniteFeed<T extends WithLikeCount>(
  data: InfiniteData<FeedResponse<T>>,
  entityId: string,
  patch: LikeCachePatch,
): InfiniteData<FeedResponse<T>> {
  return {
    ...data,
    pages: data.pages.map(page => patchFeed(page, entityId, patch)),
  };
}

const CONFIG = {
  IDEA: {
    detailKey: ideaMutationKeys.detail,
    allKey: ideaMutationKeys.all,
    listsKey: ideaMutationKeys.lists(),
    dashboardKey: myIdeasDashboardKeys.all,
  },
  PROBLEM: {
    detailKey: problemMutationKeys.detail,
    allKey: problemMutationKeys.all,
    listsKey: problemMutationKeys.lists(),
    dashboardKey: myProblemsDashboardKeys.all,
  },
} as const;

export function syncLikeQueryCache(
  queryClient: QueryClient,
  entityType: 'IDEA' | 'PROBLEM',
  entityId: string,
  patch: LikeCachePatch,
): void {
  const keys = CONFIG[entityType];

  queryClient.setQueryData<WithStatsLikes>(keys.detailKey(entityId), current =>
    current?.id === entityId
      ? {
          ...current,
          isLiked: patch.isLiked,
          stats: { ...current.stats, likes: patch.likeCount },
        }
      : current,
  );

  queryClient.setQueriesData<InfiniteData<FeedResponse<WithLikeCount>>>(
    { queryKey: keys.allKey },
    current =>
      current?.pages ? patchInfiniteFeed(current, entityId, patch) : current,
  );

  queryClient.setQueriesData<FeedResponse<WithLikeCount>>(
    { queryKey: keys.listsKey },
    current => (current ? patchFeed(current, entityId, patch) : current),
  );

  queryClient.setQueriesData<InfiniteData<FeedResponse<WithLikeCount>>>(
    { queryKey: keys.dashboardKey },
    current =>
      current?.pages ? patchInfiniteFeed(current, entityId, patch) : current,
  );
}
