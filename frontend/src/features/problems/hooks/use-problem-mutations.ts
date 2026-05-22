import {
  type CreateProblemPayload,
  createProblem,
  createProblemDraft,
  fetchMyProblems,
} from '@/features/problems/api/problems.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useCreateProblemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['problems', 'create'],
    mutationFn: (payload: CreateProblemPayload) => createProblem(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['problems', 'mine'] });
      void queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/** @deprecated Use useCreateProblemMutation */
export function useCreateProblemDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['problems', 'create-draft'],
    mutationFn: createProblemDraft,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['problems', 'mine'] });
      toast.success('Problem draft created');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useMyProblemsQuery(
  params?: Parameters<typeof fetchMyProblems>[0],
) {
  return useQuery({
    queryKey: ['problems', 'mine', params],
    queryFn: async () => {
      const feed = await fetchMyProblems(params);
      return feed.data;
    },
  });
}
