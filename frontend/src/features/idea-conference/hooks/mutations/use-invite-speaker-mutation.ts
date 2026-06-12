import { inviteConferenceSpeaker } from '@/features/idea-conference/api/idea-conference.api';
import type { CreateConferenceInvitePayload } from '@/features/idea-conference/api/idea-conference-api.types';
import { ideaConferenceQueryKeys } from '@/features/idea-conference/lib/idea-conference-query-keys';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useInviteSpeakerMutation(
  ideaId: string,
  conferenceId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConferenceInvitePayload) =>
      inviteConferenceSpeaker(ideaId, conferenceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ideaConferenceQueryKeys.suggestedSpeakers(ideaId, conferenceId),
      });
      void queryClient.invalidateQueries({
        queryKey: ideaConferenceQueryKeys.suggestedSpeakers(ideaId),
      });
      toast.success('Speaker invite sent');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
