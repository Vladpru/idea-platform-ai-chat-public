import { fetchLiveChatRoomByEntity } from '@/features/live-chat/api/live-chat.api';
import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import { isApiNotFoundError } from '@/shared/api/api-error';
import { useQuery } from '@tanstack/react-query';

type UseLiveChatRoomByEntityQueryOptions = {
  enabled?: boolean;
};

export function useLiveChatRoomByEntityQuery(
  entityType: LiveChatEntityType,
  entityId: string,
  options?: UseLiveChatRoomByEntityQueryOptions,
) {
  return useQuery({
    queryKey: liveChatQueryKeys.roomByEntity(entityType, entityId),
    queryFn: () => fetchLiveChatRoomByEntity(entityType, entityId),
    enabled: Boolean(entityId) && (options?.enabled ?? true),
    retry: (_count, error) => !isApiNotFoundError(error),
  });
}
