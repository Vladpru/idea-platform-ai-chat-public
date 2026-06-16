import { fetchSuggestedSpeakers } from '@/features/conference/api/conference.api';
import type { ConferenceEntity } from '@/features/conference/api/conference-api.types';
import { conferenceQueryKeys } from '@/features/conference/lib/conference-query-keys';
import { useQuery } from '@tanstack/react-query';

export function useSuggestedSpeakersQuery(
  entity: ConferenceEntity,
  options?: { enabled?: boolean; conferenceId?: string },
) {
  return useQuery({
    queryKey: conferenceQueryKeys.suggestedSpeakers(
      entity,
      options?.conferenceId,
    ),
    queryFn: () => fetchSuggestedSpeakers(entity, options?.conferenceId),
    enabled: options?.enabled ?? Boolean(entity.entityId),
  });
}
