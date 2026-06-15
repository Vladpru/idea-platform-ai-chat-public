import { Injectable } from '@nestjs/common';

import { EntityTarget } from '../entity-visibility/entity-target.enum';
import { PrismaService } from '../prisma/prisma.service';
import { buildDirectPairKey } from './live-chat-direct.util';
import {
  LIVE_CHAT_AUTHOR_SELECT,
  liveChatMessageInclude,
  liveChatRoomInclude,
} from './live-chat.constants';
import { toEntityTeam } from './live-chat.mapper';
import type {
  LiveChatMessageRecord,
  LiveChatRoomRecord,
} from './live-chat.records';
import type { LiveChatTeamMemberDto } from './types/live-chat.types';

type LastMessageRow = {
  id: string;
  roomId: string;
  authorId: string;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  createdAt: Date;
  authorUserId: string;
  authorFirstName: string | null;
  authorLastName: string | null;
  authorAvatarUrl: string | null;
};

@Injectable()
export class LiveChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  findVisibleRooms(userId: string): Promise<LiveChatRoomRecord[]> {
    return this.prisma.liveChatRoom.findMany({
      where: {
        OR: [
          {
            idea: {
              OR: [{ authorId: userId }, { members: { some: { userId } } }],
            },
          },
          {
            problem: {
              OR: [{ authorId: userId }, { members: { some: { userId } } }],
            },
          },
          {
            problemId: { not: null },
            messages: { some: { authorId: userId } },
          },
          {
            ideaId: null,
            problemId: null,
            participants: { some: { userId } },
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: liveChatRoomInclude,
    });
  }

  findDirectRoom(
    userAId: string,
    userBId: string,
  ): Promise<LiveChatRoomRecord | null> {
    return this.prisma.liveChatRoom.findUnique({
      where: { directPairKey: buildDirectPairKey(userAId, userBId) },
      include: liveChatRoomInclude,
    });
  }

  findRoomByEntity(
    entityType: EntityTarget,
    entityId: string,
  ): Promise<LiveChatRoomRecord | null> {
    return this.prisma.liveChatRoom.findFirst({
      where:
        entityType === EntityTarget.IDEA
          ? { ideaId: entityId }
          : { problemId: entityId },
      include: liveChatRoomInclude,
    });
  }

  findRoomById(roomId: string): Promise<LiveChatRoomRecord | null> {
    return this.prisma.liveChatRoom.findUnique({
      where: { id: roomId },
      include: liveChatRoomInclude,
    });
  }

  createRoom(data: {
    ideaId: string | null;
    problemId: string | null;
    directPairKey?: string | null;
    createdById: string;
    participantUserIds?: string[];
  }): Promise<LiveChatRoomRecord> {
    const { participantUserIds, ...roomData } = data;

    return this.prisma.liveChatRoom.create({
      data: {
        ...roomData,
        ...(participantUserIds?.length
          ? {
              participants: {
                create: participantUserIds.map(userId => ({ userId })),
              },
            }
          : {}),
      },
      include: liveChatRoomInclude,
    });
  }

  isRoomParticipant(roomId: string, userId: string): Promise<boolean> {
    return this.prisma.liveChatParticipant
      .findUnique({
        where: {
          roomId_userId: { roomId, userId },
        },
        select: { id: true },
      })
      .then(row => row !== null);
  }

  findUserById(userId: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  }

  findLastMessage(roomId: string): Promise<LiveChatMessageRecord | null> {
    return this.prisma.liveChatMessage.findFirst({
      where: { roomId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: liveChatMessageInclude,
    });
  }

  async findLastMessages(roomIds: string[]): Promise<LiveChatMessageRecord[]> {
    if (roomIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<LastMessageRow[]>`
      SELECT DISTINCT ON (m.room_id)
        m.id,
        m.room_id AS "roomId",
        m.author_id AS "authorId",
        m.content,
        m.attachment_url AS "attachmentUrl",
        m.attachment_name AS "attachmentName",
        m.attachment_mime_type AS "attachmentMimeType",
        m.created_at AS "createdAt",
        u.id AS "authorUserId",
        u.first_name AS "authorFirstName",
        u.last_name AS "authorLastName",
        u.avatar_url AS "authorAvatarUrl"
      FROM live_chat_message m
      INNER JOIN "user" u ON u.id = m.author_id
      WHERE m.room_id::text = ANY(${roomIds}::text[])
      ORDER BY m.room_id, m.created_at DESC, m.id DESC
    `;

    return rows.map(row => ({
      id: row.id,
      roomId: row.roomId,
      authorId: row.authorId,
      content: row.content,
      attachmentUrl: row.attachmentUrl,
      attachmentName: row.attachmentName,
      attachmentMimeType: row.attachmentMimeType,
      createdAt: row.createdAt,
      author: {
        id: row.authorUserId,
        firstName: row.authorFirstName,
        lastName: row.authorLastName,
        avatarUrl: row.authorAvatarUrl,
      },
    }));
  }

  findMessageCursor(
    roomId: string,
    cursorId: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.liveChatMessage.findFirst({
      where: { id: cursorId, roomId },
      select: { id: true },
    });
  }

  findMessages(params: {
    roomId: string;
    limit: number;
    cursor?: string;
  }): Promise<LiveChatMessageRecord[]> {
    return this.prisma.liveChatMessage.findMany({
      where: { roomId: params.roomId },
      take: params.limit + 1,
      skip: params.cursor ? 1 : 0,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: liveChatMessageInclude,
    });
  }

  createMessage(data: {
    roomId: string;
    authorId: string;
    content: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentMimeType?: string | null;
  }): Promise<LiveChatMessageRecord> {
    return this.prisma.$transaction(async tx => {
      const created = await tx.liveChatMessage.create({
        data: {
          roomId: data.roomId,
          authorId: data.authorId,
          content: data.content,
          attachmentUrl: data.attachmentUrl ?? null,
          attachmentName: data.attachmentName ?? null,
          attachmentMimeType: data.attachmentMimeType ?? null,
        },
        include: liveChatMessageInclude,
      });

      await tx.liveChatRoom.update({
        where: { id: data.roomId },
        data: { updatedAt: created.createdAt },
      });

      return created;
    });
  }

  private static readonly entityTeamSelect = {
    id: true,
    author: { select: LIVE_CHAT_AUTHOR_SELECT },
    members: {
      select: {
        user: { select: LIVE_CHAT_AUTHOR_SELECT },
      },
      orderBy: { joinedAt: 'asc' as const },
    },
  };

  async findIdeaTeamsByIds(
    ideaIds: string[],
  ): Promise<Map<string, LiveChatTeamMemberDto[]>> {
    if (ideaIds.length === 0) {
      return new Map();
    }

    const ideas = await this.prisma.idea.findMany({
      where: { id: { in: ideaIds } },
      select: LiveChatRepository.entityTeamSelect,
    });

    return new Map(
      ideas.map(idea => [idea.id, toEntityTeam(idea.author, idea.members)]),
    );
  }

  async findProblemTeamsByIds(
    problemIds: string[],
  ): Promise<Map<string, LiveChatTeamMemberDto[]>> {
    if (problemIds.length === 0) {
      return new Map();
    }

    const problems = await this.prisma.problem.findMany({
      where: { id: { in: problemIds } },
      select: LiveChatRepository.entityTeamSelect,
    });

    return new Map(
      problems.map(problem => [
        problem.id,
        toEntityTeam(problem.author, problem.members),
      ]),
    );
  }

  async findEntityTeam(
    entityType: EntityTarget,
    entityId: string,
  ): Promise<LiveChatTeamMemberDto[]> {
    if (entityType === EntityTarget.IDEA) {
      const teams = await this.findIdeaTeamsByIds([entityId]);
      return teams.get(entityId) ?? [];
    }

    const teams = await this.findProblemTeamsByIds([entityId]);
    return teams.get(entityId) ?? [];
  }
}
