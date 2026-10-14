import { useQuery } from '@tanstack/react-query';

import { fetchNudge } from '../../api/ai-chat.api';
import { aiChatQueryKeys } from '../../model/ai-chat-query-keys';

export function useNudgeQuery(sessionMessageCount: number) {
  return useQuery({
    queryKey: aiChatQueryKeys.nudge(),
    queryFn: fetchNudge,
    staleTime: 5 * 60 * 1000,
    enabled: sessionMessageCount === 0,
  });
}
