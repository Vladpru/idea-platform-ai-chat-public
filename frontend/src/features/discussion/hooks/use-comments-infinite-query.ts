import {
  COMMENTS_PAGE_SIZE,
  fetchComments,
} from '@/features/discussion/api/comments.api';
import type {
  CommentSort,
  DiscussionEntityType,
} from '@/features/discussion/api/comments-api.types';
import { commentQueryKeys } from '@/features/discussion/hooks/comment-query-keys';
import { useInfiniteQuery } from '@tanstack/react-query';

type UseCommentsInfiniteQueryOptions = {
  enabled?: boolean;
  sort?: CommentSort;
};

export function useCommentsInfiniteQuery(
  entityType: DiscussionEntityType,
  entityId: string,
  options?: UseCommentsInfiniteQueryOptions,
) {
  const sort = options?.sort ?? 'newest';

  return useInfiniteQuery({
    queryKey: commentQueryKeys.infinite(entityType, entityId, sort),
    queryFn: ({ pageParam }) =>
      fetchComments({
        entityType,
        entityId,
        page: pageParam as number,
        limit: COMMENTS_PAGE_SIZE,
        sort,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled: Boolean(entityId) && (options?.enabled ?? true),
  });
}
