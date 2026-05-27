import {
  fetchProblemById,
  fetchProblems,
} from '@/features/problems/api/problems.api';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
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
      return toProblemDetails(dto);
    },
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
      const feed = await fetchProblems({ limit: 12, sort: 'newest' });
      return feed.data
        .filter(item => item.id !== problemId && item.status === 'PUBLISHED')
        .slice(0, 3)
        .map(toSimilarProblemCard);
    },
    enabled: options?.enabled ?? true,
  });
}
