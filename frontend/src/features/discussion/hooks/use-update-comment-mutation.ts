import { updateComment } from '@/features/discussion/api/comments.api';
import type { UpdateCommentPayload } from '@/features/discussion/api/comments-api.types';
import type {
  DiscussionEntityType,
  PaginatedCommentsResponse,
} from '@/features/discussion/api/comments-api.types';
import { commentQueryKeys } from '@/features/discussion/hooks/comment-query-keys';
import {
  restoreCommentInfiniteQuery,
  snapshotCommentInfiniteQuery,
  syncCommentContentInCache,
} from '@/features/discussion/lib/sync-comment-mutation-cache';
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';

type UpdateCommentVariables = {
  commentId: string;
  payload: UpdateCommentPayload;
};

export function useUpdateCommentMutation(
  entityType: DiscussionEntityType,
  entityId: string,
) {
  const queryClient = useQueryClient();
  const entityQueryKey = commentQueryKeys.entity(entityType, entityId);

  return useMutation({
    mutationFn: ({ commentId, payload }: UpdateCommentVariables) =>
      updateComment(commentId, payload),
    onMutate: async ({ commentId, payload }) => {
      await queryClient.cancelQueries({ queryKey: entityQueryKey });

      const previousData = snapshotCommentInfiniteQuery(
        queryClient,
        entityType,
        entityId,
      );

      syncCommentContentInCache(queryClient, entityType, entityId, commentId, {
        content: payload.content.trim(),
      });

      return { previousData };
    },
    onSuccess: realUpdatedComment => {
      queryClient.setQueriesData<InfiniteData<PaginatedCommentsResponse>>(
        { queryKey: entityQueryKey },
        old => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(c =>
                c.id === realUpdatedComment.id ? realUpdatedComment : c,
              ),
            })),
          };
        },
      );
    },
    onError: (_error, _variables, context) => {
      toast.error('Could not update comment');
      restoreCommentInfiniteQuery(
        queryClient,
        entityType,
        entityId,
        context?.previousData,
      );
    },
  });
}
