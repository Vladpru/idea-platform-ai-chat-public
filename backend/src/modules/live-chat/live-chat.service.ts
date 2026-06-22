import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';
import { RealtimePublisherService } from '../../realtime/realtime-publisher.service';
import { REALTIME_NAMESPACES } from '../../realtime/realtime.types';
import { isUniqueConstraintError } from '../../shared/utils/is-unique-error.util';
import { EntityTarget } from '../entity-visibility/entity-target.enum';
import { EntityVisibilityService } from '../entity-visibility/entity-visibility.service';
import { NOTIFICATION_EVENTS } from '../notification/events/notification-event-names';
import type { DirectMessageReceivedNotificationEvent } from '../notification/events/notification.events';
import { GetLiveChatMessagesQueryDto } from './dto/get-live-chat-messages-query.dto';
import { SendLiveChatMessagePayloadDto } from './dto/send-live-chat-message.dto';
import { buildDirectPairKey } from './live-chat-direct.util';
import { LiveChatRateLimitService } from './live-chat-rate-limit.service';
import {
  LIVE_CHAT_CANNOT_CHAT_WITH_SELF,
  LIVE_CHAT_INVALID_ENTITY,
  LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH,
  LIVE_CHAT_MESSAGE_LIST_MAX,
  LIVE_CHAT_ROOM_NOT_FOUND,
  LIVE_CHAT_USER_NOT_FOUND,
  liveChatRoomName,
} from './live-chat.constants';
import {
  formatAuthorDisplayName,
  toLiveChatMessageResponse,
  toLiveChatRoomResponse,
  toParticipantTeam,
} from './live-chat.mapper';
import type {
  LiveChatMessageRecord,
  LiveChatRoomRecord,
} from './live-chat.records';
import { LiveChatRepository } from './live-chat.repository';
import type {
  LiveChatMessageDto,
  LiveChatRoomDto,
  LiveChatRoomListResponse,
  LiveChatTeamMemberDto,
  PaginatedLiveChatMessagesResponse,
} from './types/live-chat.types';
import { toVideoCallResponse } from './video-call.mapper';
import { VideoCallRepository } from './video-call.repository';

export type LiveChatAttachmentPayload = {
  url: string;
  name: string;
  mimeType: string;
};

@Injectable()
export class LiveChatService {
  constructor(
    private readonly liveChatRepository: LiveChatRepository,
    private readonly videoCallRepository: VideoCallRepository,
    private readonly entityVisibility: EntityVisibilityService,
    private readonly rateLimit: LiveChatRateLimitService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cloudinary: CloudinaryService,
    private readonly realtimePublisher: RealtimePublisherService,
  ) {}

  async listRooms(userId: string): Promise<LiveChatRoomListResponse> {
    const rooms = await this.liveChatRepository.findVisibleRooms(userId);
    const lastMessages = await this.liveChatRepository.findLastMessages(
      rooms.map(room => room.id),
    );
    const lastMessageByRoomId = new Map(
      lastMessages.map(message => [message.roomId, message]),
    );

    const ideaIds = [
      ...new Set(
        rooms
          .map(room => room.ideaId)
          .filter((ideaId): ideaId is string => ideaId !== null),
      ),
    ];
    const problemIds = [
      ...new Set(
        rooms
          .map(room => room.problemId)
          .filter((problemId): problemId is string => problemId !== null),
      ),
    ];

    const [ideaTeamsById, problemTeamsById, activeCalls] = await Promise.all([
      this.liveChatRepository.findIdeaTeamsByIds(ideaIds),
      this.liveChatRepository.findProblemTeamsByIds(problemIds),
      this.videoCallRepository.findActiveCallsByRoomIds(
        rooms.map(room => room.id),
      ),
    ]);

    const activeCallByRoomId = new Map(
      activeCalls.map(call => [call.roomId, toVideoCallResponse(call)]),
    );

    const data = rooms.map(room =>
      toLiveChatRoomResponse(
        room,
        userId,
        lastMessageByRoomId.get(room.id) ?? null,
        this.resolveRoomTeam(room, ideaTeamsById, problemTeamsById),
        activeCallByRoomId.get(room.id) ?? null,
      ),
    );

    return { data };
  }

  async createOrGetRoom(
    entityType: EntityTarget,
    entityId: string,
    userId: string,
  ): Promise<LiveChatRoomDto> {
    await this.entityVisibility.assertEntityLiveChatAccess(
      entityType,
      entityId,
      userId,
    );

    const existingRoom = await this.liveChatRepository.findRoomByEntity(
      entityType,
      entityId,
    );

    if (existingRoom) {
      return this.toRoomDto(existingRoom, userId);
    }

    const room = await this.liveChatRepository.createRoom({
      ideaId: entityType === EntityTarget.IDEA ? entityId : null,
      problemId: entityType === EntityTarget.PROBLEM ? entityId : null,
      createdById: userId,
    });

    return toLiveChatRoomResponse(room, userId, null);
  }

  async createOrGetDirectRoom(
    targetUserId: string,
    userId: string,
  ): Promise<LiveChatRoomDto> {
    if (targetUserId === userId) {
      throw new BadRequestException(LIVE_CHAT_CANNOT_CHAT_WITH_SELF);
    }

    const targetUser = await this.liveChatRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException(LIVE_CHAT_USER_NOT_FOUND);
    }

    const directPairKey = buildDirectPairKey(userId, targetUserId);

    const existingRoom = await this.liveChatRepository.findDirectRoom(
      userId,
      targetUserId,
    );

    if (existingRoom) {
      return this.toRoomDto(existingRoom, userId);
    }

    try {
      const room = await this.liveChatRepository.createRoom({
        ideaId: null,
        problemId: null,
        directPairKey,
        createdById: userId,
        participantUserIds: [userId, targetUserId],
      });

      const team = toParticipantTeam(room);
      return toLiveChatRoomResponse(room, userId, null, team);
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const racedRoom = await this.liveChatRepository.findDirectRoom(
        userId,
        targetUserId,
      );

      if (!racedRoom) {
        throw error;
      }

      return this.toRoomDto(racedRoom, userId);
    }
  }

  async findRoomByEntity(
    entityType: EntityTarget,
    entityId: string,
    userId: string,
  ): Promise<LiveChatRoomDto> {
    await this.entityVisibility.assertEntityLiveChatAccess(
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

    return this.toRoomDto(room, userId);
  }

  async findRoomById(roomId: string, userId: string): Promise<LiveChatRoomDto> {
    const room = await this.getAccessibleRoom(roomId, userId);
    return this.toRoomDto(room, userId);
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

  async uploadMessageAttachment(
    roomId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<LiveChatAttachmentPayload> {
    if (!file) {
      throw new UnprocessableEntityException('No file provided');
    }

    await this.getAccessibleRoom(roomId, userId);

    const uploaded = await this.cloudinary.uploadLiveChatAttachment(
      file,
      roomId,
    );

    return {
      url: uploaded.url,
      name: file.originalname,
      mimeType: file.mimetype,
    };
  }

  async sendMessage(
    roomId: string,
    userId: string,
    content: string,
    clientMessageId: string,
    attachment?: LiveChatAttachmentPayload | null,
  ): Promise<{ message: LiveChatMessageDto; isDuplicate: boolean }> {
    await this.rateLimit.assertRateLimit(userId);

    const trimmedContent = content.trim();

    if (trimmedContent.length === 0 && !attachment?.url) {
      throw new BadRequestException(
        'Message content or attachment is required',
      );
    }

    if (trimmedContent.length > LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH) {
      throw new BadRequestException(
        `Message content must be at most ${LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH} characters`,
      );
    }

    const room = await this.getAccessibleRoom(roomId, userId);

    try {
      const message = await this.liveChatRepository.createMessage({
        roomId,
        authorId: userId,
        clientMessageId,
        content: trimmedContent,
        attachmentUrl: attachment?.url ?? null,
        attachmentName: attachment?.name ?? null,
        attachmentMimeType: attachment?.mimeType ?? null,
      });

      this.emitDirectMessageNotifications(room, message, userId);

      return {
        message: toLiveChatMessageResponse(message),
        isDuplicate: false,
      };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await this.liveChatRepository.findByClientMessageId(
        userId,
        clientMessageId,
      );
      if (!existing) {
        throw error;
      }

      return {
        message: toLiveChatMessageResponse(existing),
        isDuplicate: true,
      };
    }
  }

  async assertRoomAccess(roomId: string, userId: string): Promise<void> {
    await this.getAccessibleRoom(roomId, userId);
  }

  async processInboundMessage(
    userId: string,
    payload: SendLiveChatMessagePayloadDto,
  ): Promise<LiveChatMessageDto> {
    const attachment: LiveChatAttachmentPayload | null = payload.attachmentUrl
      ? {
          url: payload.attachmentUrl,
          name: payload.attachmentName ?? payload.attachmentUrl,
          mimeType: payload.attachmentMimeType ?? 'application/octet-stream',
        }
      : null;

    const { message } = await this.sendMessage(
      payload.roomId,
      userId,
      payload.content,
      payload.clientMessageId,
      attachment,
    );

    this.realtimePublisher.publish(
      {
        namespace: REALTIME_NAMESPACES.LIVE_CHAT,
        room: liveChatRoomName(payload.roomId),
      },
      'message',
      message,
    );

    return message;
  }

  private async toRoomDto(
    room: LiveChatRoomRecord,
    userId: string,
  ): Promise<LiveChatRoomDto> {
    const lastMessage = await this.liveChatRepository.findLastMessage(room.id);
    const team = await this.getRoomTeam(room);
    return toLiveChatRoomResponse(room, userId, lastMessage, team);
  }

  private emitDirectMessageNotifications(
    room: LiveChatRoomRecord,
    message: LiveChatMessageRecord,
    senderId: string,
  ): void {
    if (room.ideaId || room.problemId || room.participants.length === 0) {
      return;
    }

    const actorName = formatAuthorDisplayName(message.author);
    const contentSnippet = this.toNotificationSnippet(message.content);

    for (const participant of room.participants) {
      const recipientUserId = participant.user.id;
      if (recipientUserId === senderId) {
        continue;
      }

      const event: DirectMessageReceivedNotificationEvent = {
        recipientUserId,
        roomId: room.id,
        messageId: message.id,
        actorId: senderId,
        actorName,
        contentSnippet,
      };

      this.eventEmitter.emit(
        NOTIFICATION_EVENTS.DIRECT_MESSAGE_RECEIVED,
        event,
      );
    }
  }

  private toNotificationSnippet(content: string, maxLength = 120): string {
    const normalized = content.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength).trimEnd()}…`;
  }

  private resolveRoomTeam(
    room: LiveChatRoomRecord,
    ideaTeamsById: Map<string, LiveChatTeamMemberDto[]>,
    problemTeamsById: Map<string, LiveChatTeamMemberDto[]>,
  ): LiveChatTeamMemberDto[] {
    if (room.ideaId) {
      return ideaTeamsById.get(room.ideaId) ?? [];
    }

    if (room.problemId) {
      return problemTeamsById.get(room.problemId) ?? [];
    }

    if (room.participants.length > 0) {
      return toParticipantTeam(room);
    }

    return [];
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

    if (room.participants.length > 0) {
      return toParticipantTeam(room);
    }

    return [];
  }

  private async getAccessibleRoom(
    roomId: string,
    userId: string,
  ): Promise<LiveChatRoomRecord> {
    // ⚠️ DEBUG-ONLY INSTRUMENTATION ⚠️
    // Authorization diagnostics are embedded into the thrown HttpException
    // message so they surface to the client in the room:join_denied "reason"
    // field (server logs on Render are not accessible). This intentionally
    // leaks room existence + membership state to the caller — an information
    // disclosure. REVERT BEFORE PRODUCTION.
    const ids =
      `roomId="${roomId}" (len=${roomId?.length ?? 0}); ` +
      `userId="${userId}" (len=${userId?.length ?? 0})`;

    // Prisma query #1: liveChatRoom.findUnique({ where: { id: roomId } })
    const room = await this.liveChatRepository.findRoomById(roomId);

    if (!room) {
      // Still deny — only the message is enriched.
      throw new NotFoundException(
        `${LIVE_CHAT_ROOM_NOT_FOUND} | DEBUG: ${ids}; findRoomById=null (no live_chat_room row matched id — wrong/stale roomId or deleted room)`,
      );
    }

    const roomKind = room.ideaId
      ? `idea(ideaId=${room.ideaId})`
      : room.problemId
        ? `problem(problemId=${room.problemId})`
        : `direct(participants=${room.participants.length})`;
    const found = `findRoomById=room(id=${room.id}, kind=${roomKind})`;

    if (room.ideaId) {
      // idea.findUnique (visibility) + ideaMember.findFirst (membership)
      try {
        await this.entityVisibility.assertEntityParticipant(
          EntityTarget.IDEA,
          room.ideaId,
          userId,
        );
      } catch (error) {
        // Re-throw with diagnostics; status preserved so access stays blocked.
        throw this.denyWithDiagnostics(
          error,
          `${ids}; ${found}; failedCheck=idea-member-check`,
        );
      }
      return room;
    }

    if (room.problemId) {
      // problem.findUnique (visibility only — author or PUBLISHED)
      try {
        await this.entityVisibility.assertEntityLiveChatAccess(
          EntityTarget.PROBLEM,
          room.problemId,
          userId,
        );
      } catch (error) {
        throw this.denyWithDiagnostics(
          error,
          `${ids}; ${found}; failedCheck=problem-access-check`,
        );
      }
      return room;
    }

    if (!room.ideaId && !room.problemId) {
      // liveChatParticipant.findUnique on composite key roomId_userId
      const isParticipant = await this.liveChatRepository.isRoomParticipant(
        roomId,
        userId,
      );

      if (!isParticipant) {
        throw new NotFoundException(
          `${LIVE_CHAT_ROOM_NOT_FOUND} | DEBUG: ${ids}; ${found}; failedCheck=direct-participant-check; isRoomParticipant=false (no live_chat_participant row for {roomId, userId})`,
        );
      }

      return room;
    }

    throw new BadRequestException(
      `${LIVE_CHAT_INVALID_ENTITY} | DEBUG: ${ids}; ${found}; failedCheck=invalid-entity`,
    );
  }

  // ⚠️ DEBUG-ONLY: re-throw the original HttpException with diagnostics appended,
  // preserving its HTTP status so the authorization decision is NOT bypassed.
  // The original error class name reveals which gate fired:
  //   NotFoundException  -> entity not visible (draft/archived/not found)
  //   ForbiddenException -> visible but the user is not a member.
  // REVERT BEFORE PRODUCTION.
  private denyWithDiagnostics(error: unknown, diagnostics: string): HttpException {
    if (error instanceof HttpException) {
      return new HttpException(
        `${error.message} | DEBUG: ${diagnostics}; cause=${error.constructor.name}`,
        error.getStatus(),
      );
    }
    // Non-HTTP errors are unexpected (e.g. DB throw) — surface the type/message.
    return new HttpException(
      `Access denied | DEBUG: ${diagnostics}; cause=${error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error)}`,
      403,
    );
  }
}
