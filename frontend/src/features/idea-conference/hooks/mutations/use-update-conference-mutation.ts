import { updateIdeaConference } from '@/features/idea-conference/api/idea-conference.api';
import type { UpdateConferencePayload } from '@/features/idea-conference/api/idea-conference-api.types';
import { ideaConferenceQueryKeys } from '@/features/idea-conference/lib/idea-conference-query-keys';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type UpdateConferenceVariables = UpdateConferencePayload & {
  conferenceId: string;
};

function getSuccessMessage(action: UpdateConferencePayload['action']): string {
  if (action === 'start') {
    return 'Conference started successfully!';
  }

  if (action === 'end') {
    return 'Conference ended successfully.';
  }

  return 'Conference cancelled.';
}

function getFailureMessage(action: UpdateConferencePayload['action']): string {
  if (action === 'start') {
    return 'Failed to start conference';
  }

  if (action === 'end') {
    return 'Failed to end conference';
  }

  return 'Failed to update conference';
}

export function useUpdateConferenceMutation(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conferenceId, action }: UpdateConferenceVariables) => {
      if (!conferenceId) {
        throw new Error('Conference ID is required');
      }

      return updateIdeaConference(ideaId, conferenceId, { action });
    },
    onSuccess: (updatedConference, variables) => {
      queryClient.setQueryData(
        ideaConferenceQueryKeys.conference(ideaId, variables.conferenceId),
        updatedConference,
      );

      void queryClient.invalidateQueries({
        queryKey: ideaConferenceQueryKeys.byIdea(ideaId),
      });

      toast.success(getSuccessMessage(variables.action));
    },
    onError: (error, variables) => {
      toast.error(
        getApiErrorMessage(error) || getFailureMessage(variables.action),
      );
    },
  });
}
