import { useQuery } from '@tanstack/react-query';

import { fetchSessions } from '../../api/ai-chat.api';
import { aiChatQueryKeys } from '../../model/ai-chat-query-keys';

export function useSessionsQuery() {
  return useQuery({
    queryKey: aiChatQueryKeys.sessions(),
    queryFn: fetchSessions,
  });
}
