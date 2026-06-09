import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EntityTarget } from '../entity-visibility/entity-target.enum';
import { EntityVisibilityService } from '../entity-visibility/entity-visibility.service';
import { GetLiveChatMessagesQueryDto } from './dto/get-live-chat-messages-query.dto';
import { LiveChatRateLimitService } from './live-chat-rate-limit.service';
import {
  LIVE_CHAT_INVALID_ENTITY,
  LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH,
  LIVE_CHAT_MESSAGE_LIST_MAX,
  LIVE_CHAT_ROOM_NOT_FOUND,
} from './live-chat.constants';
import {
  toLiveChatMessageResponse,
  toLiveChatRoomResponse,
} from './live-chat.mapper';
import type { LiveChatRoomRecord } from './live-chat.records';
import { LiveChatRepository } from './live-chat.repository';
import type {
  LiveChatMessageDto,
  LiveChatRoomDto,
  LiveChatRoomListResponse,
  PaginatedLiveChatMessagesResponse,
} from './types/live-chat.types';

@Injectable()
export class LiveChatService {
  constructor(
    private readonly liveChatRepository: LiveChatRepository,
    private readonly entityVisibility: EntityVisibilityService,
    private readonly rateLimit: LiveChatRateLimitService,
  ) {}

  async listRooms(userId: string): Promise<LiveChatRoomListResponse> {
    const rooms = await this.liveChatRepository.findVisibleRooms(userId);
    const lastMessages = await this.liveChatRepository.findLastMessages(
      rooms.map(room => room.id),
    );
    const lastMessageByRoomId = new Map(
      lastMessages.map(message => [message.roomId, message]),
    );

    const data = await Promise.all(
      rooms.map(async room => {
        const team = await this.getRoomTeam(room);
        return toLiveChatRoomResponse(
          room,
          lastMessageByRoomId.get(room.id) ?? null,
          team,
        );
      }),
    );

    return { data };
  }

  async createOrGetRoom(
    entityType: EntityTarget,
    entityId: string,
    userId: string,
  ): Promise<LiveChatRoomDto> {
    await this.entityVisibility.assertEntityParticipant(
      entityType,
      entityId,
      userId,
    );

    const existingRoom = await this.liveChatRepository.findRoomByEntity(
      entityType,
      entityId,
    );

    if (existingRoom) {
      return this.toRoomDto(existingRoom);
    }

    const room = await this.liveChatRepository.createRoom({
      ideaId: entityType === EntityTarget.IDEA ? entityId : null,
      problemId: entityType === EntityTarget.PROBLEM ? entityId : null,
      createdById: userId,
    });

    return toLiveChatRoomResponse(room, null);
  }

  async findRoomByEntity(
    entityType: EntityTarget,
    entityId: string,
    userId: string,
  ): Promise<LiveChatRoomDto> {
    await this.entityVisibility.assertEntityParticipant(
      entityType,
      entityId,
      userId,
    );

    const room = await this.liveChatRepository.findRoomByEntity(
      entityType,
      entityId,
    );

    if (!room) {
      throw new NotFoundException(LIVE_CHAT_ROOM_NOT_FOUND);
    }

    return this.toRoomDto(room);
  }

  async findRoomById(roomId: string, userId: string): Promise<LiveChatRoomDto> {
    const room = await this.getAccessibleRoom(roomId, userId);
    return this.toRoomDto(room);
  }

  async findMessages(
    roomId: string,
    userId: string,
    query: GetLiveChatMessagesQueryDto,
  ): Promise<PaginatedLiveChatMessagesResponse> {
    await this.getAccessibleRoom(roomId, userId);

    const limit = Math.max(
      1,
      Math.min(
        query.limit ?? LIVE_CHAT_MESSAGE_LIST_MAX,
        LIVE_CHAT_MESSAGE_LIST_MAX,
      ),
    );

    if (query.cursor) {
      const cursorRow = await this.liveChatRepository.findMessageCursor(
        roomId,
        query.cursor,
      );

      if (!cursorRow) {
        throw new BadRequestException('Invalid live chat message cursor');
      }
    }

    const messages = await this.liveChatRepository.findMessages({
      roomId,
      limit,
      cursor: query.cursor,
    });

    const hasOlder = messages.length > limit;
    const page = hasOlder ? messages.slice(0, -1) : messages;
    const ordered = [...page].reverse();

    return {
      data: ordered.map(toLiveChatMessageResponse),
      meta: {
        limit,
        hasOlder,
        nextCursor: hasOlder ? (ordered[0]?.id ?? null) : null,
      },
    };
  }

  async sendMessage(
    roomId: string,
    userId: string,
    content: string,
  ): Promise<LiveChatMessageDto> {
    await this.rateLimit.assertRateLimit(userId);

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      throw new BadRequestException('Message content is required');
    }

    if (trimmedContent.length > LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH) {
      throw new BadRequestException(
        `Message content must be at most ${LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH} characters`,
      );
    }

    await this.getAccessibleRoom(roomId, userId);

    const message = await this.liveChatRepository.createMessage({
      roomId,
      authorId: userId,
      content: trimmedContent,
    });

    return toLiveChatMessageResponse(message);
  }

  async assertRoomAccess(roomId: string, userId: string): Promise<void> {
    await this.getAccessibleRoom(roomId, userId);
  }

  private async toRoomDto(room: LiveChatRoomRecord): Promise<LiveChatRoomDto> {
    const lastMessage = await this.liveChatRepository.findLastMessage(room.id);
    const team = await this.getRoomTeam(room);
    return toLiveChatRoomResponse(room, lastMessage, team);
  }

  private async getRoomTeam(room: LiveChatRoomRecord) {
    if (room.ideaId) {
      return this.liveChatRepository.findEntityTeam(
        EntityTarget.IDEA,
        room.ideaId,
      );
    }

    if (room.problemId) {
      return this.liveChatRepository.findEntityTeam(
        EntityTarget.PROBLEM,
        room.problemId,
      );
    }

    return [];
  }

  private async getAccessibleRoom(
    roomId: string,
    userId: string,
  ): Promise<LiveChatRoomRecord> {
    const room = await this.liveChatRepository.findRoomById(roomId);

    if (!room) {
      throw new NotFoundException(LIVE_CHAT_ROOM_NOT_FOUND);
    }

    if (room.ideaId) {
      await this.entityVisibility.assertEntityParticipant(
        EntityTarget.IDEA,
        room.ideaId,
        userId,
      );
      return room;
    }

    if (room.problemId) {
      await this.entityVisibility.assertEntityParticipant(
        EntityTarget.PROBLEM,
        room.problemId,
        userId,
      );
      return room;
    }

    throw new BadRequestException(LIVE_CHAT_INVALID_ENTITY);
  }
}
