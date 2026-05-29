import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/shared/api/http';
import {
  getLikeEntityQueryKeys,
  restoreLikeQueryCache,
  snapshotLikeQueryCache,
  syncLikeQueryCache,
} from '@/shared/lib/sync-like-query-cache';

type LikeToggleState = {
  isLiked: boolean;
  likeCount: number;
};

export function useEntityLikeToggle(entityType: 'IDEA' | 'PROBLEM') {
  const queryClient = useQueryClient();
  const queryKeys = getLikeEntityQueryKeys(entityType);

  return useMutation({
    mutationFn: async ({ id }: { id: string; nextState: LikeToggleState }) => {
      const endpoint =
        entityType === 'IDEA' ? `/ideas/${id}/like` : `/problems/${id}/like`;
      await api.post(endpoint);
    },
    onMutate: async ({ id, nextState }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.allKey }),
        queryClient.cancelQueries({ queryKey: queryKeys.dashboardKey }),
        queryClient.cancelQueries({ queryKey: queryKeys.ideaDetailsKey }),
      ]);

      const previousData = snapshotLikeQueryCache(queryClient, entityType);

      syncLikeQueryCache(queryClient, entityType, id, nextState);

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      toast.error('Could not update like');
      restoreLikeQueryCache(queryClient, context?.previousData);
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.allKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.ideaDetailsKey }),
      ]);
    },
  });
}
