import { fetchSuggestedSpeakers } from '@/features/idea-conference/api/idea-conference.api';
import { ideaConferenceQueryKeys } from '@/features/idea-conference/lib/idea-conference-query-keys';
import { useQuery } from '@tanstack/react-query';

export function useSuggestedSpeakersQuery(
  ideaId: string,
  options?: { enabled?: boolean; conferenceId?: string },
) {
  return useQuery({
    queryKey: ideaConferenceQueryKeys.suggestedSpeakers(
      ideaId,
      options?.conferenceId,
    ),
    queryFn: () => fetchSuggestedSpeakers(ideaId, options?.conferenceId),
    enabled: options?.enabled ?? Boolean(ideaId),
  });
}
