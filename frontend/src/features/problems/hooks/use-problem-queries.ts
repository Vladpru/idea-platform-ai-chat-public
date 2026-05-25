import {
  fetchMyProblems,
  fetchProblemById,
  fetchProblems,
} from '@/features/problems/api/problems.api';
import type {
  MyProblemsListParams,
  ProblemsListParams,
} from '@/features/problems/api/problems-api.types';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import { useQuery } from '@tanstack/react-query';

export function useProblemsListQuery(params?: ProblemsListParams) {
  return useQuery({
    queryKey: problemMutationKeys.list(params),
    queryFn: () => fetchProblems(params),
  });
}

export function useMyProblemsQuery(params?: MyProblemsListParams) {
  return useQuery({
    queryKey: problemMutationKeys.mine(params),
    queryFn: () => fetchMyProblems(params),
  });
}

export function useProblemQuery(problemId: string | null | undefined) {
  return useQuery({
    queryKey: problemMutationKeys.detail(problemId ?? ''),
    queryFn: () => {
      if (!problemId) throw new Error('Missing problem id');
      return fetchProblemById(problemId);
    },
    enabled: Boolean(problemId),
  });
}
