import { fetchProblemById } from '@/features/problems/api/problems.api';
import { fetchSimilarItems } from '@/features/similarity/api/similarity.api';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import { shouldRetryDetailResourceQuery } from '@/shared/lib/detail-resource-query';
import { useQuery } from '@tanstack/react-query';

import {
  toProblemDetails,
  toSimilarProblemCard,
} from '../model/problem-details.mapper';

export function useProblemDetailsQuery(problemId: string) {
  return useQuery({
    queryKey: problemMutationKeys.detail(problemId),
    queryFn: async () => {
      const dto = await fetchProblemById(problemId);
      if (!dto?.id) {
        return null;
      }
      return toProblemDetails(dto);
    },
    enabled: Boolean(problemId),
    retry: shouldRetryDetailResourceQuery,
    refetchInterval: query =>
      query.state.data?.summaryStatus === 'PENDING' ? 3000 : false,
    refetchIntervalInBackground: false,
  });
}

type SimilarProblemsQueryOptions = {
  enabled?: boolean;
};

export function useSimilarProblemsQuery(
  problemId: string,
  options?: SimilarProblemsQueryOptions,
) {
  return useQuery({
    queryKey: [...problemMutationKeys.detail(problemId), 'similar'] as const,
    queryFn: async () => {
      const items = await fetchSimilarItems({
        entityType: 'problem',
        sourceId: problemId,
        limit: 3,
      });
      return items
        .filter(item => item.id !== problemId)
        .map(toSimilarProblemCard);
    },
    enabled: Boolean(problemId) && (options?.enabled ?? true),
  });
}
