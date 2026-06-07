import { fetchIdeaFormById } from '@/features/ideas/api/ideas.api';
import { fetchSimilarItems } from '@/features/similarity/api/similarity.api';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import {
  toIdeaDetails,
  toSimilarIdeaCard,
} from '@/features/idea-details/model/idea-details.mapper';
import { shouldRetryDetailResourceQuery } from '@/shared/lib/detail-resource-query';
import { getSummaryRefetchInterval } from '@/shared/lib/summary-polling';
import { useQuery } from '@tanstack/react-query';

import type { IdeaDetails } from '../model/idea-details.types';

async function fetchIdeaDetailsByQueryKey({
  queryKey,
}: {
  queryKey: readonly unknown[];
}): Promise<IdeaDetails | null> {
  const ideaId = String(queryKey[2]);
  const dto = await fetchIdeaFormById(ideaId);
  if (!dto?.id) {
    return null;
  }
  return toIdeaDetails(dto);
}

export function useIdeaDetailsQuery(ideaId: string) {
  return useQuery({
    queryKey: ideaMutationKeys.detail(ideaId),
    queryFn: fetchIdeaDetailsByQueryKey,
    enabled: Boolean(ideaId),
    retry: shouldRetryDetailResourceQuery,
    refetchInterval: getSummaryRefetchInterval,
    refetchIntervalInBackground: false,
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
