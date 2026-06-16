import { joinConference } from '@/features/conference/api/conference.api';
import type { ConferenceEntity } from '@/features/conference/api/conference-api.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useJoinConferenceMutation(
  entity: ConferenceEntity,
  conferenceId: string,
) {
  return useMutation({
    mutationFn: () => joinConference(entity, conferenceId),
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
