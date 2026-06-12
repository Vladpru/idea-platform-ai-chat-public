import { scheduleIdeaConference } from '@/features/idea-conference/api/idea-conference.api';
import type { ScheduleIdeaConferencePayload } from '@/features/idea-conference/api/idea-conference-api.types';
import { ideaConferenceQueryKeys } from '@/features/idea-conference/lib/idea-conference-query-keys';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useScheduleConferenceMutation(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScheduleIdeaConferencePayload) =>
      scheduleIdeaConference(ideaId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ideaConferenceQueryKeys.byIdea(ideaId),
      });
      void queryClient.invalidateQueries({
        queryKey: ideaConferenceQueryKeys.suggestedSpeakers(ideaId),
      });
      toast.success('Conference scheduled');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
