import { fetchConferences } from '@/features/conference/api/conference.api';
import type { ConferenceEntity } from '@/features/conference/api/conference-api.types';
import { conferenceQueryKeys } from '@/features/conference/lib/conference-query-keys';
import { useQuery } from '@tanstack/react-query';

export function useConferenceQuery(
  entity: ConferenceEntity,
  conferenceId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: conferenceQueryKeys.conference(entity, conferenceId),
    queryFn: async () => {
      const response = await fetchConferences(entity);
      const conference = response.conferences.find(
        item => item.id === conferenceId,
      );

      if (!conference) {
        throw new Error('Conference not found');
      }

      return conference;
    },
    enabled: options?.enabled ?? Boolean(entity.entityId && conferenceId),
    refetchInterval: query => {
      const status = query.state.data?.status;

      if (status === 'SCHEDULED') {
        return 5_000;
      }

      return false;
    },
  });
}
