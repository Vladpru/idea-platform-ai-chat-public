import { fetchVideoCalls } from '@/features/live-chat/api/live-chat.api';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import { useQuery } from '@tanstack/react-query';

type UseVideoCallsQueryOptions = {
  enabled?: boolean;
};

export function useVideoCallsQuery(
  roomId: string,
  options?: UseVideoCallsQueryOptions,
) {
  return useQuery({
    queryKey: liveChatQueryKeys.calls(roomId),
    queryFn: () => fetchVideoCalls(roomId),
    enabled: Boolean(roomId) && (options?.enabled ?? true),
    staleTime: 0,
  });
}
