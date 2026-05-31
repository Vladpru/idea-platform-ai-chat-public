import { updateComment } from '@/features/discussion/api/comments.api';
import type { UpdateCommentPayload } from '@/features/discussion/api/comments-api.types';
import type { DiscussionEntityType } from '@/features/discussion/api/comments-api.types';
import { commentQueryKeys } from '@/features/discussion/hooks/comment-query-keys';
import {
  restoreCommentInfiniteQuery,
  snapshotCommentInfiniteQuery,
  syncCommentContentInCache,
} from '@/features/discussion/lib/sync-comment-mutation-cache';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
    onError: (_error, _variables, context) => {
      toast.error('Could not update comment');
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
