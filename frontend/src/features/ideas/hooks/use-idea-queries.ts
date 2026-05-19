import { fetchIdeaById, fetchIdeas } from '@/features/ideas/api/ideas.api';
import type { IdeasListParams } from '@/features/ideas/api/ideas-api.types';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import { useQuery } from '@tanstack/react-query';

export function useIdeasListQuery(params?: IdeasListParams) {
  return useQuery({
    queryKey: ideaMutationKeys.list(params),
    queryFn: () => fetchIdeas(params),
  });
}

export function useIdeaQuery(ideaId: string | null | undefined) {
  return useQuery({
    queryKey: ideaMutationKeys.detail(ideaId ?? ''),
    queryFn: () => {
      if (!ideaId) throw new Error('Missing idea id');
      return fetchIdeaById(ideaId);
    },
    enabled: Boolean(ideaId),
  });
}
