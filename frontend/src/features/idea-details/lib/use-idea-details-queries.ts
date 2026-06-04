import { fetchIdeaFormById } from '@/features/ideas/api/ideas.api';
import { fetchSimilarItems } from '@/features/similarity/api/similarity.api';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import {
  toIdeaDetails,
  toSimilarIdeaCard,
} from '@/features/idea-details/model/idea-details.mapper';
import { shouldRetryDetailResourceQuery } from '@/shared/lib/detail-resource-query';
import { useQuery } from '@tanstack/react-query';

export function useIdeaDetailsQuery(ideaId: string) {
  return useQuery({
    queryKey: ideaMutationKeys.detail(ideaId),
    queryFn: async () => {
      const dto = await fetchIdeaFormById(ideaId);
      if (!dto?.id) {
        return null;
      }
      return toIdeaDetails(dto);
    },
    enabled: Boolean(ideaId),
    retry: shouldRetryDetailResourceQuery,
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
      const items = await fetchSimilarItems({
        entityType: 'idea',
        sourceId: ideaId,
        limit: 3,
      });
      return items.map(toSimilarIdeaCard);
    },
    enabled: Boolean(ideaId) && (options?.enabled ?? true),
  });
}
