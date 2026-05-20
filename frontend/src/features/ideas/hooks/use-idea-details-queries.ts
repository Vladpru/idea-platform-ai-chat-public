import {
  fetchIdeaFormById,
  fetchSimilarIdeas,
} from '@/features/ideas/api/ideas.api';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import {
  toIdeaDetails,
  toSimilarIdeaCard,
} from '@/features/ideas/model/idea-details.mapper';
import { useQuery } from '@tanstack/react-query';

export function useIdeaDetailsQuery(ideaId: string) {
  return useQuery({
    queryKey: ideaMutationKeys.detail(ideaId),
    queryFn: async () => {
      const dto = await fetchIdeaFormById(ideaId);
      return toIdeaDetails(dto);
    },
    enabled: Boolean(ideaId),
  });
}

type SimilarIdeasQueryOptions = {
  enabled?: boolean;
};

export function useSimilarIdeasQuery(
  ideaId: string,
  options?: SimilarIdeasQueryOptions,
) {
  return useQuery({
    queryKey: [...ideaMutationKeys.detail(ideaId), 'similar'] as const,
    queryFn: async () => {
      const items = await fetchSimilarIdeas(ideaId);
      return items.map(toSimilarIdeaCard);
    },
    enabled: Boolean(ideaId) && (options?.enabled ?? true),
  });
}
