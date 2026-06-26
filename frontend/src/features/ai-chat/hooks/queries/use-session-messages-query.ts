import { useQuery } from '@tanstack/react-query';

import { fetchSessionMessages } from '../../api/ai-chat.api';
import { aiChatQueryKeys } from '../../model/ai-chat-query-keys';

export function useSessionMessagesQuery(sessionId: string) {
  return useQuery({
    queryKey: aiChatQueryKeys.messages(sessionId),
    queryFn: () => fetchSessionMessages(sessionId),
  });
}
