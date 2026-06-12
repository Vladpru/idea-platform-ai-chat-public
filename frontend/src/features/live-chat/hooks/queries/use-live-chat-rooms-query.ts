import { fetchLiveChatRooms } from '@/features/live-chat/api/live-chat.api';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import { useQuery } from '@tanstack/react-query';

export function useLiveChatRoomsQuery() {
  return useQuery({
    queryKey: liveChatQueryKeys.rooms(),
    queryFn: fetchLiveChatRooms,
    select: response =>
      response.data.map(room => ({
        ...room,
        activeCall: room.activeCall ?? null,
      })),
  });
}
