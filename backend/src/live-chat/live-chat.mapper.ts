import { EntityTarget } from '../entity-visibility/entity-target.enum';
import type {
  LiveChatAuthorRecord,
  LiveChatMessageRecord,
  LiveChatRoomRecord,
} from './live-chat.records';
import type {
  LiveChatAuthorDto,
  LiveChatMessageDto,
  LiveChatRoomDto,
  LiveChatRoomEntityDto,
  LiveChatTeamMemberDto,
} from './types/live-chat.types';

function toIsoString(date: Date): string {
  return date.toISOString();
}

export function toLiveChatAuthorResponse(
  author: LiveChatAuthorRecord,
): LiveChatAuthorDto {
  return {
    id: author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    avatarUrl: author.avatarUrl,
  };
}

export function toLiveChatMessageResponse(
  message: LiveChatMessageRecord,
): LiveChatMessageDto {
  return {
    id: message.id,
    roomId: message.roomId,
    content: message.content,
    author: toLiveChatAuthorResponse(message.author),
    createdAt: toIsoString(message.createdAt),
  };
}

function toLiveChatRoomEntityResponse(
  room: LiveChatRoomRecord,
): LiveChatRoomEntityDto {
  if (room.idea) {
    return {
      type: EntityTarget.IDEA,
      id: room.idea.id,
      title: room.idea.title,
    };
  }

  if (room.problem) {
    return {
      type: EntityTarget.PROBLEM,
      id: room.problem.id,
      title: room.problem.title,
    };
  }

  throw new Error('Live chat room is missing linked entity');
}

export function toLiveChatRoomResponse(
  room: LiveChatRoomRecord,
  lastMessage: LiveChatMessageRecord | null = null,
  team: LiveChatTeamMemberDto[] = [],
): LiveChatRoomDto {
  return {
    id: room.id,
    entity: toLiveChatRoomEntityResponse(room),
    createdBy: toLiveChatAuthorResponse(room.createdBy),
    createdAt: toIsoString(room.createdAt),
    updatedAt: toIsoString(room.updatedAt),
    lastMessage: lastMessage ? toLiveChatMessageResponse(lastMessage) : null,
    team,
  };
}
