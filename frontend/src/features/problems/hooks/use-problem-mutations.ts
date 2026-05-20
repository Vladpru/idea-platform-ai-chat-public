import {
  type CreateProblemDraftPayload,
  createProblemDraft,
  fetchMyProblems,
} from '@/features/problems/api/problems.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useCreateProblemDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['problems', 'create-draft'],
    mutationFn: (payload: CreateProblemDraftPayload) =>
      createProblemDraft(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['problems', 'mine'] });
      toast.success('Problem draft created');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useMyProblemsQuery() {
  return useQuery({
    queryKey: ['problems', 'mine'],
    queryFn: fetchMyProblems,
  });
}
