import { useQuery } from '@tanstack/react-query';

import { fetchKbStats } from '../../api/ai-chat.api';
import { aiChatQueryKeys } from '../../model/ai-chat-query-keys';

export function useKbStatsQuery() {
  return useQuery({
    queryKey: aiChatQueryKeys.kbStats(),
    queryFn: fetchKbStats,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
