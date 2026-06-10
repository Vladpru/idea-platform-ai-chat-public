import type { EntityTarget } from '../../entity-visibility/entity-target.enum';

export type {
  LiveChatAuthorRecord,
  LiveChatMessageRecord,
  LiveChatRoomRecord,
} from '../live-chat.records';

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
  type: EntityTarget;
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
