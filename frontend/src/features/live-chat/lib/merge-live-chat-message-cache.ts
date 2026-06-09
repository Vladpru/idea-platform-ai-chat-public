import type {
  LiveChatMessageDto,
  LiveChatMessagesCache,
} from '@/features/live-chat/api/live-chat-api.types';

export function appendLiveChatMessage(
  cache: LiveChatMessagesCache | undefined,
  message: LiveChatMessageDto,
): LiveChatMessagesCache {
  if (!cache) {
    return {
      messages: [message],
      hasOlder: false,
      nextCursor: null,
    };
  }

  if (cache.messages.some(existing => existing.id === message.id)) {
    return cache;
  }

  return {
    ...cache,
    messages: [...cache.messages, message],
  };
}

export function prependOlderLiveChatMessages(
  cache: LiveChatMessagesCache,
  olderMessages: LiveChatMessageDto[],
  hasOlder: boolean,
  nextCursor: string | null,
): LiveChatMessagesCache {
  const existingIds = new Set(cache.messages.map(message => message.id));
  const uniqueOlder = olderMessages.filter(
    message => !existingIds.has(message.id),
  );

  return {
    messages: [...uniqueOlder, ...cache.messages],
    hasOlder,
    nextCursor,
  };
}

export function toMessagesCacheFromResponse(
  data: LiveChatMessageDto[],
  hasOlder: boolean,
  nextCursor: string | null,
): LiveChatMessagesCache {
  return {
    messages: data,
    hasOlder,
    nextCursor,
  };
}
