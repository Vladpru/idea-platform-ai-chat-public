import { inviteConferenceSpeaker } from '@/features/conference/api/conference.api';
import type {
  ConferenceEntity,
  CreateConferenceInvitePayload,
} from '@/features/conference/api/conference-api.types';
import { conferenceQueryKeys } from '@/features/conference/lib/conference-query-keys';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useInviteSpeakerMutation(
  entity: ConferenceEntity,
  conferenceId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConferenceInvitePayload) =>
      inviteConferenceSpeaker(entity, conferenceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conferenceQueryKeys.suggestedSpeakers(entity, conferenceId),
      });
      void queryClient.invalidateQueries({
        queryKey: conferenceQueryKeys.suggestedSpeakers(entity),
      });
      toast.success('Speaker invite sent');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
