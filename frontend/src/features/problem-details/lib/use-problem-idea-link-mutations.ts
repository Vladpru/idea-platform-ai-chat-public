import {
  fetchProblemById,
  updateProblem,
} from '@/features/problems/api/problems.api';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

function invalidateProblemDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  problemId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: problemMutationKeys.detail(problemId),
  });
}

type LinkIdeasToProblemInput = {
  ideaIds: string[];
  expectedVersion?: number;
};

export function useLinkIdeasToProblemMutation(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'link-ideas', problemId],
    mutationFn: async ({ ideaIds, expectedVersion }: LinkIdeasToProblemInput) => {
      const form = await fetchProblemById(problemId);
      const existingIds = form.ideas.map(idea => idea.id);
      const mergedIds = [...new Set([...existingIds, ...ideaIds])];
      return updateProblem(
        problemId,
        { ideaIds: mergedIds },
        expectedVersion ?? form.version,
      );
    },
    onSuccess: () => {
      invalidateProblemDetail(queryClient, problemId);
      toast.success('Ideas linked');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUnlinkIdeaFromProblemMutation(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'unlink-idea', problemId],
    mutationFn: async (ideaId: string) => {
      const form = await fetchProblemById(problemId);
      const remainingIds = form.ideas
        .map(idea => idea.id)
        .filter(id => id !== ideaId);
      return updateProblem(problemId, { ideaIds: remainingIds }, form.version);
    },
    onSuccess: () => {
      invalidateProblemDetail(queryClient, problemId);
      toast.success('Idea unlinked');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
