import { Injectable } from '@nestjs/common';

import { EntityTarget } from '../entity-visibility/entity-target.enum';
import { PrismaService } from '../prisma/prisma.service';
import {
  LIVE_CHAT_AUTHOR_SELECT,
  liveChatMessageInclude,
  liveChatRoomInclude,
} from './live-chat.constants';
import { toLiveChatAuthorResponse } from './live-chat.mapper';
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

  async findDirectRoom(
    userAId: string,
    userBId: string,
  ): Promise<LiveChatRoomRecord | null> {
    const candidates = await this.prisma.liveChatRoom.findMany({
      where: {
        ideaId: null,
        problemId: null,
        participants: { some: { userId: userAId } },
      },
      include: liveChatRoomInclude,
    });

    return (
      candidates.find(room => {
        if (room.participants.length !== 2) {
          return false;
        }

        const participantIds = room.participants.map(
          participant => participant.user.id,
        );

        return (
          participantIds.includes(userAId) && participantIds.includes(userBId)
        );
      }) ?? null
    );
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
  }): Promise<LiveChatMessageRecord> {
    return this.prisma.$transaction(async tx => {
      const created = await tx.liveChatMessage.create({
        data,
        include: liveChatMessageInclude,
      });

      await tx.liveChatRoom.update({
        where: { id: data.roomId },
        data: { updatedAt: created.createdAt },
      });

      return created;
    });
  }

  async findEntityTeam(
    entityType: EntityTarget,
    entityId: string,
  ): Promise<LiveChatTeamMemberDto[]> {
    if (entityType === EntityTarget.IDEA) {
      const idea = await this.prisma.idea.findUnique({
        where: { id: entityId },
        select: {
          author: { select: LIVE_CHAT_AUTHOR_SELECT },
          members: {
            select: {
              user: { select: LIVE_CHAT_AUTHOR_SELECT },
            },
            orderBy: { joinedAt: 'asc' },
          },
        },
      });

      if (!idea) {
        return [];
      }

      return [
        { ...toLiveChatAuthorResponse(idea.author), isAuthor: true },
        ...idea.members.map(member => ({
          ...toLiveChatAuthorResponse(member.user),
          isAuthor: false,
        })),
      ];
    }

    const problem = await this.prisma.problem.findUnique({
      where: { id: entityId },
      select: {
        author: { select: LIVE_CHAT_AUTHOR_SELECT },
        members: {
          select: {
            user: { select: LIVE_CHAT_AUTHOR_SELECT },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!problem) {
      return [];
    }

    return [
      { ...toLiveChatAuthorResponse(problem.author), isAuthor: true },
      ...problem.members.map(member => ({
        ...toLiveChatAuthorResponse(member.user),
        isAuthor: false,
      })),
    ];
  }
}
