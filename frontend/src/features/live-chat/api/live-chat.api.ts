import { api } from '@/shared/api/http';

import { LIVE_CHAT_ROUTES } from './live-chat.routes';
import type {
  CreateLiveChatRoomPayload,
  CreateVideoCallPayload,
  FetchLiveChatMessagesParams,
  JoinVideoCallResponse,
  LiveChatAttachmentPayload,
  LiveChatRoomDto,
  LiveChatRoomListResponse,
  PaginatedLiveChatMessagesResponse,
  UpdateVideoCallPayload,
  VideoCallDto,
  VideoCallListResponse,
} from './live-chat-api.types';

export const LIVE_CHAT_MESSAGES_PAGE_SIZE = 50;

export async function uploadLiveChatAttachment(
  roomId: string,
  file: File,
): Promise<LiveChatAttachmentPayload> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<LiveChatAttachmentPayload>(
    LIVE_CHAT_ROUTES.uploadAttachment(roomId),
    formData,
  );
  return data;
}

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

export async function fetchVideoCalls(
  roomId: string,
): Promise<VideoCallListResponse> {
  const { data } = await api.get<VideoCallListResponse>(
    LIVE_CHAT_ROUTES.calls(roomId),
  );
  return data;
}

export async function createVideoCall(
  roomId: string,
  payload: CreateVideoCallPayload = {},
): Promise<VideoCallDto> {
  const { data } = await api.post<VideoCallDto>(
    LIVE_CHAT_ROUTES.calls(roomId),
    payload,
  );
  return data;
}

export async function updateVideoCall(
  roomId: string,
  callId: string,
  payload: UpdateVideoCallPayload,
): Promise<VideoCallDto> {
  const { data } = await api.patch<VideoCallDto>(
    LIVE_CHAT_ROUTES.call(roomId, callId),
    payload,
  );
  return data;
}

export async function joinVideoCall(
  roomId: string,
  callId: string,
): Promise<JoinVideoCallResponse> {
  const { data } = await api.post<JoinVideoCallResponse>(
    LIVE_CHAT_ROUTES.joinCall(roomId, callId),
  );
  return data;
}
