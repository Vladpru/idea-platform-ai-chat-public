import { deleteComment } from '@/features/discussion/api/comments.api';
import type { DiscussionEntityType } from '@/features/discussion/api/comments-api.types';
import { commentQueryKeys } from '@/features/discussion/hooks/comment-query-keys';
import {
  removeCommentFromCache,
  restoreCommentInfiniteQuery,
  snapshotCommentInfiniteQuery,
} from '@/features/discussion/lib/sync-comment-mutation-cache';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useDeleteCommentMutation(
  entityType: DiscussionEntityType,
  entityId: string,
) {
  const queryClient = useQueryClient();
  const entityQueryKey = commentQueryKeys.entity(entityType, entityId);

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onMutate: async commentId => {
      await queryClient.cancelQueries({ queryKey: entityQueryKey });

      const previousData = snapshotCommentInfiniteQuery(
        queryClient,
        entityType,
        entityId,
      );

      removeCommentFromCache(queryClient, entityType, entityId, commentId);

      return { previousData };
    },
    onError: (_error, _commentId, context) => {
      toast.error('Could not delete comment');
      restoreCommentInfiniteQuery(
        queryClient,
        entityType,
        entityId,
        context?.previousData,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: entityQueryKey });

      if (entityType === 'IDEA') {
        void queryClient.invalidateQueries({
          queryKey: ideaMutationKeys.detail(entityId),
        });
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: problemMutationKeys.detail(entityId),
      });
    },
  });
}
