import { toggleCommentLike } from '@/features/discussion/api/comments.api';
import type { DiscussionEntityType } from '@/features/discussion/api/comments-api.types';
import { commentQueryKeys } from '@/features/discussion/hooks/comment-query-keys';
import {
  restoreCommentInfiniteQuery,
  snapshotCommentInfiniteQuery,
  syncCommentLikeInCache,
  type CommentLikePatch,
} from '@/features/discussion/lib/sync-comment-like-query-cache';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type CommentLikeToggleVariables = {
  commentId: string;
  nextState: CommentLikePatch;
};

export function useCommentLikeToggle(
  entityType: DiscussionEntityType,
  entityId: string,
) {
  const queryClient = useQueryClient();
  const entityQueryKey = commentQueryKeys.entity(entityType, entityId);

  return useMutation({
    mutationFn: async ({ commentId }: CommentLikeToggleVariables) => {
      await toggleCommentLike(commentId);
    },
    onMutate: async ({ commentId, nextState }) => {
      await queryClient.cancelQueries({ queryKey: entityQueryKey });

      const previousData = snapshotCommentInfiniteQuery(
        queryClient,
        entityType,
        entityId,
      );

      syncCommentLikeInCache(
        queryClient,
        entityType,
        entityId,
        commentId,
        nextState,
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      toast.error('Could not update like');
      restoreCommentInfiniteQuery(
        queryClient,
        entityType,
        entityId,
        context?.previousData,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: entityQueryKey });
    },
  });
}
