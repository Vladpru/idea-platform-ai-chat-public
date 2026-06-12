import { fetchIdeaConferences } from '@/features/idea-conference/api/idea-conference.api';
import { ideaConferenceQueryKeys } from '@/features/idea-conference/lib/idea-conference-query-keys';
import { useQuery } from '@tanstack/react-query';

export function useIdeaConferenceQuery(
  ideaId: string,
  conferenceId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ideaConferenceQueryKeys.conference(ideaId, conferenceId),
    queryFn: async () => {
      const response = await fetchIdeaConferences(ideaId);
      const conference = response.conferences.find(
        item => item.id === conferenceId,
      );

      if (!conference) {
        throw new Error('Conference not found');
      }

      return conference;
    },
    enabled: options?.enabled ?? Boolean(ideaId && conferenceId),
    refetchInterval: query => {
      const status = query.state.data?.status;

      if (status === 'SCHEDULED') {
        return 5_000;
      }

      return false;
    },
  });
}
