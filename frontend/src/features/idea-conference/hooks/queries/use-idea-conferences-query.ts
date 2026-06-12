import { fetchIdeaConferences } from '@/features/idea-conference/api/idea-conference.api';
import { ideaConferenceQueryKeys } from '@/features/idea-conference/lib/idea-conference-query-keys';
import { useQuery } from '@tanstack/react-query';

export function useIdeaConferencesQuery(
  ideaId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ideaConferenceQueryKeys.byIdea(ideaId),
    queryFn: () => fetchIdeaConferences(ideaId),
    enabled: options?.enabled ?? Boolean(ideaId),
    refetchInterval: query => {
      const hasLive = query.state.data?.conferences.some(c => c.status === 'LIVE');
      return hasLive ? 10_000 : false;
    },
  });
}
