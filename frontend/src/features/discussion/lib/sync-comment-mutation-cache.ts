import type {
  CommentDto,
  DiscussionEntityType,
  PaginatedCommentsResponse,
} from '@/features/discussion/api/comments-api.types';
import { commentQueryKeys } from '@/features/discussion/hooks/comment-query-keys';
import type { IdeaDetails } from '@/features/idea-details/model/idea-details.types';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import type { ProblemDetails } from '@/features/problem-details/model/problem-details.types';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

export type CommentLikePatch = {
  isLiked: boolean;
  likeCount: number;
};

export type CommentContentPatch = {
  content: string;
};

export type CommentInfiniteQueriesSnapshot = Array<
  [queryKey: readonly unknown[], data: InfiniteData<PaginatedCommentsResponse>]
>;

function mapCommentsInInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  mapFn: (comment: CommentDto) => CommentDto,
): InfiniteData<PaginatedCommentsResponse> {
  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      data: page.data.map(mapFn),
    })),
  };
}

export function patchCommentInInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  commentId: string,
  patch: CommentLikePatch,
): InfiniteData<PaginatedCommentsResponse> {
  return mapCommentsInInfiniteData(data, comment =>
    comment.id === commentId
      ? { ...comment, isLiked: patch.isLiked, likeCount: patch.likeCount }
      : comment,
  );
}

export function updateCommentContentInInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  commentId: string,
  patch: CommentContentPatch,
): InfiniteData<PaginatedCommentsResponse> {
  return mapCommentsInInfiniteData(data, comment =>
    comment.id === commentId ? { ...comment, content: patch.content } : comment,
  );
}

export function removeCommentFromInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  commentId: string,
): InfiniteData<PaginatedCommentsResponse> {
  return {
    ...data,
    pages: data.pages.map(page => {
      const filtered = page.data.filter(comment => comment.id !== commentId);
      const removedCount = page.data.length - filtered.length;

      return {
        ...page,
        data: filtered,
        meta: {
          ...page.meta,
          total: Math.max(0, page.meta.total - removedCount),
        },
      };
    }),
  };
}

function updateAllCommentInfiniteQueries(
  queryClient: QueryClient,
  entityType: DiscussionEntityType,
  entityId: string,
  updater: (
    data: InfiniteData<PaginatedCommentsResponse>,
  ) => InfiniteData<PaginatedCommentsResponse>,
): void {
  queryClient.setQueriesData<InfiniteData<PaginatedCommentsResponse>>(
    { queryKey: commentQueryKeys.entity(entityType, entityId) },
    old => (old ? updater(old) : old),
  );
}

export function syncCommentLikeInCache(
  queryClient: QueryClient,
  entityType: DiscussionEntityType,
  entityId: string,
  commentId: string,
  patch: CommentLikePatch,
): void {
  updateAllCommentInfiniteQueries(queryClient, entityType, entityId, old =>
    patchCommentInInfiniteData(old, commentId, patch),
  );
}

export function syncCommentContentInCache(
  queryClient: QueryClient,
  entityType: DiscussionEntityType,
  entityId: string,
  commentId: string,
  patch: CommentContentPatch,
): void {
  updateAllCommentInfiniteQueries(queryClient, entityType, entityId, old =>
    updateCommentContentInInfiniteData(old, commentId, patch),
  );
}

export function removeCommentFromCache(
  queryClient: QueryClient,
  entityType: DiscussionEntityType,
  entityId: string,
  commentId: string,
): void {
  updateAllCommentInfiniteQueries(queryClient, entityType, entityId, old =>
    removeCommentFromInfiniteData(old, commentId),
  );
}

export function snapshotCommentInfiniteQuery(
  queryClient: QueryClient,
  entityType: DiscussionEntityType,
  entityId: string,
): CommentInfiniteQueriesSnapshot {
  return queryClient
    .getQueriesData<InfiniteData<PaginatedCommentsResponse>>({
      queryKey: commentQueryKeys.entity(entityType, entityId),
    })
    .filter(
      (entry): entry is CommentInfiniteQueriesSnapshot[number] =>
        entry[1] !== undefined,
    );
}

export function restoreCommentInfiniteQuery(
  queryClient: QueryClient,
  _entityType: DiscussionEntityType,
  _entityId: string,
  snapshot: CommentInfiniteQueriesSnapshot | undefined,
): void {
  if (!snapshot) {
    return;
  }

  for (const [queryKey, data] of snapshot) {
    queryClient.setQueryData(queryKey, data);
  }
}

function patchDiscussionCount<T extends IdeaDetails | ProblemDetails>(
  details: T,
  delta: number,
): T {
  return {
    ...details,
    counts: {
      ...details.counts,
      discussion: Math.max(0, details.counts.discussion + delta),
    },
    stats: {
      ...details.stats,
      comments: Math.max(0, details.stats.comments + delta),
    },
  };
}

export function adjustEntityDiscussionCountInCache(
  queryClient: QueryClient,
  entityType: DiscussionEntityType,
  entityId: string,
  delta: number,
): void {
  if (entityType === 'IDEA') {
    queryClient.setQueryData<IdeaDetails>(
      ideaMutationKeys.detail(entityId),
      old => (old ? patchDiscussionCount(old, delta) : old),
    );
    return;
  }

  queryClient.setQueryData<ProblemDetails>(
    problemMutationKeys.detail(entityId),
    old => (old ? patchDiscussionCount(old, delta) : old),
  );
}
