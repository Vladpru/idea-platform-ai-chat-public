export type LiveChatEntityType = 'ideas' | 'problems' | 'users';

export type LiveChatAuthorDto = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type LiveChatMessageDto = {
  id: string;
  roomId: string;
  clientMessageId: string;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  author: LiveChatAuthorDto;
  createdAt: string;
  /**
   * Client-only flag: true while an optimistic message awaits its authoritative
   * server broadcast. Cleared when reconciled (the server copy omits it).
   */
  pending?: boolean;
};

export type LiveChatAttachmentPayload = {
  url: string;
  name: string;
  mimeType: string;
};

export type LiveChatRoomEntityDto = {
  type: LiveChatEntityType;
  id: string;
  title: string | null;
};

export type LiveChatTeamMemberDto = LiveChatAuthorDto & {
  isAuthor: boolean;
};

export type LiveChatRoomDto = {
  id: string;
  entity: LiveChatRoomEntityDto;
  createdBy: LiveChatAuthorDto;
  createdAt: string;
  updatedAt: string;
  lastMessage: LiveChatMessageDto | null;
  team: LiveChatTeamMemberDto[];
  activeCall: VideoCallDto | null;
};

export type PaginatedLiveChatMessagesResponse = {
  data: LiveChatMessageDto[];
  meta: {
    limit: number;
    hasOlder: boolean;
    nextCursor: string | null;
  };
};

export type LiveChatRoomListResponse = {
  data: LiveChatRoomDto[];
};

export type CreateLiveChatRoomPayload = {
  entityType: LiveChatEntityType;
  entityId: string;
};

export type FetchLiveChatMessagesParams = {
  roomId: string;
  cursor?: string;
  limit?: number;
};

export type LiveChatMessagesCache = {
  messages: LiveChatMessageDto[];
  hasOlder: boolean;
  nextCursor: string | null;
};

export type VideoCallStatusDto =
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ENDED'
  | 'CANCELLED';

export type VideoCallDto = {
  id: string;
  roomId: string;
  host: LiveChatAuthorDto;
  status: VideoCallStatusDto;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type VideoCallListResponse = {
  activeCall: VideoCallDto | null;
  upcomingCalls: VideoCallDto[];
};

export type VideoCallLifecyclePayload = {
  callId: string;
  roomId: string;
};

export type CreateVideoCallPayload = {
  scheduledFor?: string;
};

export type UpdateVideoCallPayload = {
  action: 'start' | 'end' | 'cancel';
};

export type JoinVideoCallResponse = {
  token: string;
  livekitUrl: string;
  call: VideoCallDto;
};
