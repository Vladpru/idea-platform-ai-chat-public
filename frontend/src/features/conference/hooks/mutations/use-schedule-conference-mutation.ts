import { scheduleConference } from '@/features/conference/api/conference.api';
import type {
  ConferenceEntity,
  ScheduleConferencePayload,
} from '@/features/conference/api/conference-api.types';
import { conferenceQueryKeys } from '@/features/conference/lib/conference-query-keys';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useScheduleConferenceMutation(entity: ConferenceEntity) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScheduleConferencePayload) =>
      scheduleConference(entity, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conferenceQueryKeys.byEntity(entity),
      });
      void queryClient.invalidateQueries({
        queryKey: conferenceQueryKeys.suggestedSpeakers(entity),
      });
      toast.success('Conference scheduled');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
