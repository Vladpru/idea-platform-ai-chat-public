import { updateConference } from '@/features/conference/api/conference.api';
import type {
  ConferenceEntity,
  UpdateConferencePayload,
} from '@/features/conference/api/conference-api.types';
import { conferenceQueryKeys } from '@/features/conference/lib/conference-query-keys';
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

export function useUpdateConferenceMutation(entity: ConferenceEntity) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conferenceId, action }: UpdateConferenceVariables) => {
      if (!conferenceId) {
        throw new Error('Conference ID is required');
      }

      return updateConference(entity, conferenceId, { action });
    },
    onSuccess: (updatedConference, variables) => {
      queryClient.setQueryData(
        conferenceQueryKeys.conference(entity, variables.conferenceId),
        updatedConference,
      );

      void queryClient.invalidateQueries({
        queryKey: conferenceQueryKeys.byEntity(entity),
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
