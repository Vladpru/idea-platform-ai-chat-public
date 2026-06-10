import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query';

import type { IdeaDetails } from '@/features/idea-details/model/idea-details.types';
import type { SimilarIdeaCard } from '@/features/idea-details/model/idea-details.types';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import { profileContributionsKeys } from '@/features/profile/hooks/use-profile-contributions';
import { myIdeasDashboardKeys } from '@/features/profile/hooks/use-my-ideas-dashboard';
import { myProblemsDashboardKeys } from '@/features/profile/hooks/use-my-problems-dashboard';

export type LikeCachePatch = {
  isLiked: boolean;
  likeCount: number;
};

export type LikeQueryCacheSnapshot = {
  queries: Array<[QueryKey, unknown]>;
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

type ProfileContributionLikeFields = {
  id: string;
  kind: 'idea' | 'problem';
  isLiked: boolean;
  likeCount: number;
};

type ProfileContributionsPage<T> = {
  data: T[];
  meta: unknown;
};

type FeedResponse<T> = {
  data: T[];
};

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

export function getLikeEntityQueryKeys(entityType: 'IDEA' | 'PROBLEM') {
  const keys = CONFIG[entityType];
  return {
    allKey: keys.allKey,
    dashboardKey: keys.dashboardKey,
    ideaDetailsKey: ideaMutationKeys.details(),
    profileContributionsKey: profileContributionsKeys.all,
  };
}

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

function patchProfileContributionItem<T extends ProfileContributionLikeFields>(
  item: T,
  entityId: string,
  entityType: 'IDEA' | 'PROBLEM',
  patch: LikeCachePatch,
): T {
  const expectedKind = entityType === 'IDEA' ? 'idea' : 'problem';

  if (item.id !== entityId || item.kind !== expectedKind) {
    return item;
  }

  return {
    ...item,
    isLiked: patch.isLiked,
    likeCount: patch.likeCount,
  };
}

function patchProfileContributionsPage<T extends ProfileContributionLikeFields>(
  page: ProfileContributionsPage<T>,
  entityId: string,
  entityType: 'IDEA' | 'PROBLEM',
  patch: LikeCachePatch,
): ProfileContributionsPage<T> {
  return {
    ...page,
    data: page.data.map(item =>
      patchProfileContributionItem(item, entityId, entityType, patch),
    ),
  };
}

function patchProfileContributionsInfinite<
  T extends ProfileContributionLikeFields,
>(
  data: InfiniteData<ProfileContributionsPage<T>>,
  entityId: string,
  entityType: 'IDEA' | 'PROBLEM',
  patch: LikeCachePatch,
): InfiniteData<ProfileContributionsPage<T>> {
  return {
    ...data,
    pages: data.pages.map(page =>
      patchProfileContributionsPage(page, entityId, entityType, patch),
    ),
  };
}

function isIdeaDetailQueryKey(queryKey: QueryKey): boolean {
  return (
    queryKey.length === 3 &&
    queryKey[0] === ideaMutationKeys.all[0] &&
    queryKey[1] === 'detail'
  );
}

function isSimilarIdeasQueryKey(queryKey: QueryKey): boolean {
  return (
    isIdeaDetailQueryKey(queryKey.slice(0, 3)) && queryKey[3] === 'similar'
  );
}

function patchSimilarIdeas(
  cards: SimilarIdeaCard[],
  entityId: string,
  patch: LikeCachePatch,
): SimilarIdeaCard[] {
  return cards.map(card =>
    card.id === entityId
      ? {
          ...card,
          isLiked: patch.isLiked,
          stats: { ...card.stats, likes: patch.likeCount },
        }
      : card,
  );
}

function patchIdeaDetailLinkedProblems(
  idea: IdeaDetails,
  entityId: string,
  patch: LikeCachePatch,
): IdeaDetails {
  return {
    ...idea,
    linkedProblems: idea.linkedProblems.map(problem =>
      problem.id === entityId
        ? {
            ...problem,
            isLiked: patch.isLiked,
            stats: { ...problem.stats, likes: patch.likeCount },
          }
        : problem,
    ),
  };
}

export function snapshotLikeQueryCache(
  queryClient: QueryClient,
  entityType: 'IDEA' | 'PROBLEM',
): LikeQueryCacheSnapshot {
  const keys = CONFIG[entityType];
  const queryMap = new Map<string, [QueryKey, unknown]>();

  const addQueries = (queryKey: QueryKey) => {
    queryClient.getQueriesData({ queryKey }).forEach(([key, data]) => {
      queryMap.set(JSON.stringify(key), [key, data]);
    });
  };

  addQueries(keys.allKey);
  addQueries(keys.listsKey);
  addQueries(keys.dashboardKey);
  addQueries(profileContributionsKeys.all);
  addQueries(
    entityType === 'IDEA'
      ? ideaMutationKeys.details()
      : problemMutationKeys.details(),
  );

  if (entityType === 'PROBLEM') {
    addQueries(ideaMutationKeys.details());
  }

  return { queries: Array.from(queryMap.values()) };
}

export function restoreLikeQueryCache(
  queryClient: QueryClient,
  snapshot: LikeQueryCacheSnapshot | undefined,
): void {
  if (!snapshot) {
    return;
  }

  for (const [queryKey, data] of snapshot.queries) {
    queryClient.setQueryData(queryKey, data);
  }
}

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

  queryClient.setQueriesData<
    InfiniteData<ProfileContributionsPage<ProfileContributionLikeFields>>
  >({ queryKey: profileContributionsKeys.all }, current =>
    current?.pages
      ? patchProfileContributionsInfinite(current, entityId, entityType, patch)
      : current,
  );

  if (entityType === 'IDEA') {
    queryClient.setQueriesData<SimilarIdeaCard[]>(
      { predicate: query => isSimilarIdeasQueryKey(query.queryKey) },
      current =>
        current ? patchSimilarIdeas(current, entityId, patch) : current,
    );
  }

  if (entityType === 'PROBLEM') {
    queryClient.setQueriesData<IdeaDetails>(
      { predicate: query => isIdeaDetailQueryKey(query.queryKey) },
      current =>
        current?.linkedProblems?.some(problem => problem.id === entityId)
          ? patchIdeaDetailLinkedProblems(current, entityId, patch)
          : current,
    );
  }
}
