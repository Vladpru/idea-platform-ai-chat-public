export type LiveChatEntityType = 'ideas' | 'problems';

export type LiveChatAuthorDto = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type LiveChatMessageDto = {
  id: string;
  roomId: string;
  content: string;
  author: LiveChatAuthorDto;
  createdAt: string;
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
