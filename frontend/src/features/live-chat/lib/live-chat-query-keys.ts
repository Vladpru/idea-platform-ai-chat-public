import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';

export const liveChatQueryKeys = {
  all: ['live-chat'] as const,
  rooms: () => [...liveChatQueryKeys.all, 'rooms'] as const,
  room: (roomId: string) => [...liveChatQueryKeys.all, 'room', roomId] as const,
  roomByEntity: (entityType: LiveChatEntityType, entityId: string) =>
    [...liveChatQueryKeys.all, 'room-by-entity', entityType, entityId] as const,
  messages: (roomId: string) =>
    [...liveChatQueryKeys.all, 'messages', roomId] as const,
  calls: (roomId: string) =>
    [...liveChatQueryKeys.all, 'calls', roomId] as const,
};
