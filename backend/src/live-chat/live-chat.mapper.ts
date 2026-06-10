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

export function formatAuthorDisplayName(author: LiveChatAuthorRecord): string {
  const parts = [author.firstName, author.lastName].filter(
    (part): part is string => Boolean(part?.trim()),
  );

  if (parts.length > 0) {
    return parts.join(' ');
  }

  return 'User';
}

function isDirectRoom(room: LiveChatRoomRecord): boolean {
  return !room.ideaId && !room.problemId && room.participants.length > 0;
}

function resolveDirectPeer(
  room: LiveChatRoomRecord,
  viewerUserId: string,
): LiveChatAuthorRecord {
  const peer = room.participants
    .map(participant => participant.user)
    .find(user => user.id !== viewerUserId);

  return peer ?? room.participants[0]?.user ?? room.createdBy;
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
  viewerUserId: string,
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

  if (isDirectRoom(room)) {
    const peer = resolveDirectPeer(room, viewerUserId);

    return {
      type: EntityTarget.USER,
      id: peer.id,
      title: formatAuthorDisplayName(peer),
    };
  }

  throw new Error('Live chat room is missing linked context');
}

export function toParticipantTeam(
  room: LiveChatRoomRecord,
): LiveChatTeamMemberDto[] {
  return room.participants.map(participant => ({
    ...toLiveChatAuthorResponse(participant.user),
    isAuthor: false,
  }));
}

export function toLiveChatRoomResponse(
  room: LiveChatRoomRecord,
  viewerUserId: string,
  lastMessage: LiveChatMessageRecord | null = null,
  team: LiveChatTeamMemberDto[] = [],
): LiveChatRoomDto {
  return {
    id: room.id,
    entity: toLiveChatRoomEntityResponse(room, viewerUserId),
    createdBy: toLiveChatAuthorResponse(room.createdBy),
    createdAt: toIsoString(room.createdAt),
    updatedAt: toIsoString(room.updatedAt),
    lastMessage: lastMessage ? toLiveChatMessageResponse(lastMessage) : null,
    team,
  };
}
