import { fetchConferences } from '@/features/conference/api/conference.api';
import type { ConferenceEntity } from '@/features/conference/api/conference-api.types';
import { conferenceQueryKeys } from '@/features/conference/lib/conference-query-keys';
import { useQuery } from '@tanstack/react-query';

export function useConferencesQuery(
  entity: ConferenceEntity,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: conferenceQueryKeys.byEntity(entity),
    queryFn: () => fetchConferences(entity),
    enabled: options?.enabled ?? Boolean(entity.entityId),
    refetchInterval: query => {
      const hasLive = query.state.data?.conferences.some(
        c => c.status === 'LIVE',
      );
      return hasLive ? 10_000 : false;
    },
  });
}
