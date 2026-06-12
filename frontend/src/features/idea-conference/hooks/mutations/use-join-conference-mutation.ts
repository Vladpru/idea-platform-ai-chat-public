import { joinIdeaConference } from '@/features/idea-conference/api/idea-conference.api';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useJoinConferenceMutation(
  ideaId: string,
  conferenceId: string,
) {
  return useMutation({
    mutationFn: () => joinIdeaConference(ideaId, conferenceId),
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
