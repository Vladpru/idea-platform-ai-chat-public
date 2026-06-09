import {
  fetchLiveChatMessages,
  LIVE_CHAT_MESSAGES_PAGE_SIZE,
} from '@/features/live-chat/api/live-chat.api';
import type { LiveChatMessagesCache } from '@/features/live-chat/api/live-chat-api.types';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import {
  prependOlderLiveChatMessages,
  toMessagesCacheFromResponse,
} from '@/features/live-chat/lib/merge-live-chat-message-cache';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

type UseLiveChatMessagesQueryOptions = {
  enabled?: boolean;
};

export function useLiveChatMessagesQuery(
  roomId: string,
  options?: UseLiveChatMessagesQueryOptions,
) {
  const queryClient = useQueryClient();
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const query = useQuery({
    queryKey: liveChatQueryKeys.messages(roomId),
    queryFn: async () => {
      const response = await fetchLiveChatMessages({ roomId });
      return toMessagesCacheFromResponse(
        response.data,
        response.meta.hasOlder,
        response.meta.nextCursor,
      );
    },
    enabled: Boolean(roomId) && (options?.enabled ?? true),
  });

  const loadOlderMessages = useCallback(async () => {
    const cache = queryClient.getQueryData<LiveChatMessagesCache>(
      liveChatQueryKeys.messages(roomId),
    );

    if (!cache?.hasOlder || !cache.nextCursor || isLoadingOlder) {
      return;
    }

    setIsLoadingOlder(true);
    try {
      const response = await fetchLiveChatMessages({
        roomId,
        cursor: cache.nextCursor,
        limit: LIVE_CHAT_MESSAGES_PAGE_SIZE,
      });

      queryClient.setQueryData<LiveChatMessagesCache>(
        liveChatQueryKeys.messages(roomId),
        current =>
          prependOlderLiveChatMessages(
            current ?? {
              messages: [],
              hasOlder: false,
              nextCursor: null,
            },
            response.data,
            response.meta.hasOlder,
            response.meta.nextCursor,
          ),
      );
    } finally {
      setIsLoadingOlder(false);
    }
  }, [isLoadingOlder, queryClient, roomId]);

  return {
    ...query,
    messages: query.data?.messages ?? [],
    hasOlder: query.data?.hasOlder ?? false,
    loadOlderMessages,
    isLoadingOlder,
  };
}
