import { api } from '@/shared/api/http';

import { LIVE_CHAT_ROUTES } from './live-chat.routes';
import type {
  CreateLiveChatRoomPayload,
  FetchLiveChatMessagesParams,
  LiveChatRoomDto,
  LiveChatRoomListResponse,
  PaginatedLiveChatMessagesResponse,
} from './live-chat-api.types';

export const LIVE_CHAT_MESSAGES_PAGE_SIZE = 50;

export async function fetchLiveChatRooms(): Promise<LiveChatRoomListResponse> {
  const { data } = await api.get<LiveChatRoomListResponse>(
    LIVE_CHAT_ROUTES.root,
  );
  return data;
}

export async function createLiveChatRoom(
  payload: CreateLiveChatRoomPayload,
): Promise<LiveChatRoomDto> {
  const { data } = await api.post<LiveChatRoomDto>(
    LIVE_CHAT_ROUTES.root,
    payload,
  );
  return data;
}

export async function createDirectLiveChatRoom(
  userId: string,
): Promise<LiveChatRoomDto> {
  const { data } = await api.post<LiveChatRoomDto>(
    LIVE_CHAT_ROUTES.direct(userId),
  );
  return data;
}

export async function fetchLiveChatRoomByEntity(
  entityType: CreateLiveChatRoomPayload['entityType'],
  entityId: string,
): Promise<LiveChatRoomDto> {
  const { data } = await api.get<LiveChatRoomDto>(
    LIVE_CHAT_ROUTES.byEntity(entityType, entityId),
  );
  return data;
}

export async function fetchLiveChatRoom(roomId: string): Promise<LiveChatRoomDto> {
  const { data } = await api.get<LiveChatRoomDto>(LIVE_CHAT_ROUTES.room(roomId));
  return data;
}

export async function fetchLiveChatMessages({
  roomId,
  cursor,
  limit = LIVE_CHAT_MESSAGES_PAGE_SIZE,
}: FetchLiveChatMessagesParams): Promise<PaginatedLiveChatMessagesResponse> {
  const { data } = await api.get<PaginatedLiveChatMessagesResponse>(
    LIVE_CHAT_ROUTES.messages(roomId),
    { params: { cursor, limit } },
  );
  return data;
}
