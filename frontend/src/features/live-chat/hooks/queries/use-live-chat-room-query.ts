import { fetchLiveChatRoom } from '@/features/live-chat/api/live-chat.api';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import { useQuery } from '@tanstack/react-query';

type UseLiveChatRoomQueryOptions = {
  enabled?: boolean;
};

export function useLiveChatRoomQuery(
  roomId: string,
  options?: UseLiveChatRoomQueryOptions,
) {
  return useQuery({
    queryKey: liveChatQueryKeys.room(roomId),
    queryFn: () => fetchLiveChatRoom(roomId),
    select: room => ({
      ...room,
      activeCall: room.activeCall ?? null,
    }),
    enabled: Boolean(roomId) && (options?.enabled ?? true),
  });
}
