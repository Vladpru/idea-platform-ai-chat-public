import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/http';
import { syncLikeQueryCache } from '@/shared/lib/sync-like-query-cache';

type LikeToggleState = {
  isLiked: boolean;
  likeCount: number;
};

export function useEntityLikeToggle(entityType: 'IDEA' | 'PROBLEM') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; nextState: LikeToggleState }) => {
      const endpoint =
        entityType === 'IDEA' ? `/ideas/${id}/like` : `/problems/${id}/like`;
      await api.post(endpoint);
    },
    onMutate: async ({ id, nextState }) => {
      await queryClient.cancelQueries();

      const previousState = queryClient.getQueryData([entityType, id]) as
        | LikeToggleState
        | undefined;

      syncLikeQueryCache(queryClient, entityType, id, nextState);

      return { previousState, id };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousState) {
        syncLikeQueryCache(
          queryClient,
          entityType,
          context.id,
          context.previousState,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });
}
