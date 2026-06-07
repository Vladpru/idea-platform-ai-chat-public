import { fetchProblemById } from '@/features/problems/api/problems.api';
import { fetchSimilarItems } from '@/features/similarity/api/similarity.api';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import { shouldRetryDetailResourceQuery } from '@/shared/lib/detail-resource-query';
import { getSummaryRefetchInterval } from '@/shared/lib/summary-polling';
import { useQuery } from '@tanstack/react-query';

import {
  toProblemDetails,
  toSimilarProblemCard,
} from '../model/problem-details.mapper';
import type { ProblemDetails } from '../model/problem-details.types';

async function fetchProblemDetailsByQueryKey({
  queryKey,
}: {
  queryKey: readonly unknown[];
}): Promise<ProblemDetails | null> {
  const problemId = String(queryKey[2]);
  const dto = await fetchProblemById(problemId);
  if (!dto?.id) {
    return null;
  }
  return toProblemDetails(dto);
}

export function useProblemDetailsQuery(problemId: string) {
  return useQuery({
    queryKey: problemMutationKeys.detail(problemId),
    queryFn: fetchProblemDetailsByQueryKey,
    enabled: Boolean(problemId),
    retry: shouldRetryDetailResourceQuery,
    refetchInterval: getSummaryRefetchInterval,
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
