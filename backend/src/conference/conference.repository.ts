import { Injectable } from '@nestjs/common';

import {
  ConferenceInviteStatus,
  ConferenceInviteType,
  ConferenceStatus,
  Prisma,
} from '../../generated/prisma/client';
import {
  type EntityLinkTarget,
  EntityTarget,
} from '../entity-visibility/entity-target.enum';
import { LIVE_CHAT_AUTHOR_SELECT } from '../live-chat/live-chat.constants';
import { PrismaService } from '../prisma/prisma.service';
import { conferenceInclude } from './conference.records';
import type { ConferenceRecord } from './conference.records';

export type ConferenceTeamMemberRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type ConferenceTeamRecord = {
  authorId: string;
  author: ConferenceTeamMemberRecord;
  members: ConferenceTeamMemberRecord[];
};

type TeamQueryResult = {
  authorId: string;
  author: ConferenceTeamMemberRecord;
  members: { user: ConferenceTeamMemberRecord }[];
} | null;

@Injectable()
export class ConferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private entityWhere(
    target: EntityLinkTarget,
    entityId: string,
  ): { ideaId: string } | { problemId: string } {
    return target === EntityTarget.IDEA
      ? { ideaId: entityId }
      : { problemId: entityId };
  }

  private entityConnect(
    target: EntityLinkTarget,
    entityId: string,
  ): Pick<Prisma.ConferenceCreateInput, 'idea' | 'problem'> {
    return target === EntityTarget.IDEA
      ? { idea: { connect: { id: entityId } } }
      : { problem: { connect: { id: entityId } } };
  }

  private mapTeam(entity: TeamQueryResult): ConferenceTeamRecord | null {
    if (!entity) {
      return null;
    }

    return {
      authorId: entity.authorId,
      author: entity.author,
      members: entity.members.map(member => member.user),
    };
  }

  create(
    data: Prisma.ConferenceCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<ConferenceRecord> {
    const client = tx ?? this.prisma;
    return client.conference.create({
      data,
      include: conferenceInclude,
    });
  }

  createConferenceWithInvites(params: {
    target: EntityLinkTarget;
    entityId: string;
    scheduledById: string;
    title: string;
    description?: string | null;
    scheduledFor: Date;
    speakerUserIds: string[];
    invitedById: string;
  }): Promise<ConferenceRecord> {
    return this.prisma.$transaction(async tx => {
      const conference = await this.create(
        {
          ...this.entityConnect(params.target, params.entityId),
          scheduledBy: { connect: { id: params.scheduledById } },
          title: params.title,
          description: params.description ?? null,
          scheduledFor: params.scheduledFor,
        },
        tx,
      );

      if (params.speakerUserIds.length > 0) {
        await tx.conferenceInvite.createMany({
          data: params.speakerUserIds.map(userId => ({
            conferenceId: conference.id,
            invitedById: params.invitedById,
            inviteType: ConferenceInviteType.PLATFORM_USER,
            status: ConferenceInviteStatus.PENDING,
            userId,
          })),
        });
      }

      return conference;
    });
  }

  findById(
    conferenceId: string,
    target: EntityLinkTarget,
    entityId: string,
  ): Promise<ConferenceRecord | null> {
    return this.prisma.conference.findFirst({
      where: { id: conferenceId, ...this.entityWhere(target, entityId) },
      include: conferenceInclude,
    });
  }

  findManyByEntity(
    target: EntityLinkTarget,
    entityId: string,
  ): Promise<ConferenceRecord[]> {
    return this.prisma.conference.findMany({
      where: this.entityWhere(target, entityId),
      include: conferenceInclude,
      orderBy: [{ scheduledFor: 'desc' }],
    });
  }

  findLiveConference(
    target: EntityLinkTarget,
    entityId: string,
  ): Promise<ConferenceRecord | null> {
    return this.prisma.conference.findFirst({
      where: {
        ...this.entityWhere(target, entityId),
        status: ConferenceStatus.LIVE,
      },
      include: conferenceInclude,
    });
  }

  findNextScheduledConference(
    target: EntityLinkTarget,
    entityId: string,
  ): Promise<ConferenceRecord | null> {
    return this.prisma.conference.findFirst({
      where: {
        ...this.entityWhere(target, entityId),
        status: ConferenceStatus.SCHEDULED,
        scheduledFor: { gte: new Date() },
      },
      include: conferenceInclude,
      orderBy: { scheduledFor: 'asc' },
    });
  }

  findInvitesByConferenceId(conferenceId: string) {
    return this.prisma.conferenceInvite.findMany({
      where: {
        conferenceId,
        inviteType: ConferenceInviteType.PLATFORM_USER,
        userId: { not: null },
      },
      select: {
        userId: true,
        status: true,
      },
    });
  }

  findEntityTeam(
    target: EntityLinkTarget,
    entityId: string,
  ): Promise<ConferenceTeamRecord | null> {
    if (target === EntityTarget.IDEA) {
      return this.prisma.idea
        .findUnique({
          where: { id: entityId },
          select: {
            authorId: true,
            author: { select: LIVE_CHAT_AUTHOR_SELECT },
            members: {
              select: {
                user: { select: LIVE_CHAT_AUTHOR_SELECT },
              },
            },
          },
        })
        .then(entity => this.mapTeam(entity));
    }

    return this.prisma.problem
      .findUnique({
        where: { id: entityId },
        select: {
          authorId: true,
          author: { select: LIVE_CHAT_AUTHOR_SELECT },
          members: {
            select: {
              user: { select: LIVE_CHAT_AUTHOR_SELECT },
            },
          },
        },
      })
      .then(entity => this.mapTeam(entity));
  }

  findByProviderRoomName(
    providerRoomName: string,
  ): Promise<ConferenceRecord | null> {
    return this.prisma.conference.findFirst({
      where: { providerRoomName },
      include: conferenceInclude,
    });
  }

  findEntityAuthorId(
    target: EntityLinkTarget,
    entityId: string,
  ): Promise<string | null> {
    if (target === EntityTarget.IDEA) {
      return this.prisma.idea
        .findUnique({
          where: { id: entityId },
          select: { authorId: true },
        })
        .then(idea => idea?.authorId ?? null);
    }

    return this.prisma.problem
      .findUnique({
        where: { id: entityId },
        select: { authorId: true },
      })
      .then(problem => problem?.authorId ?? null);
  }

  findUserAuthor(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: LIVE_CHAT_AUTHOR_SELECT,
    });
  }

  updateStatus(
    conferenceId: string,
    data: Prisma.ConferenceUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<ConferenceRecord> {
    const client = tx ?? this.prisma;
    return client.conference.update({
      where: { id: conferenceId },
      data,
      include: conferenceInclude,
    });
  }
}
