import { Injectable } from '@nestjs/common';

import {
  ConferenceInviteStatus,
  ConferenceInviteType,
  IdeaConferenceStatus,
  Prisma,
} from '../../generated/prisma/client';
import { LIVE_CHAT_AUTHOR_SELECT } from '../live-chat/live-chat.constants';
import { PrismaService } from '../prisma/prisma.service';
import { ideaConferenceInclude } from './idea-conference.records';
import type { IdeaConferenceRecord } from './idea-conference.records';

export type IdeaTeamMemberRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type IdeaTeamRecord = {
  authorId: string;
  author: IdeaTeamMemberRecord;
  members: IdeaTeamMemberRecord[];
};

@Injectable()
export class IdeaConferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.IdeaConferenceCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<IdeaConferenceRecord> {
    const client = tx ?? this.prisma;
    return client.ideaConference.create({
      data,
      include: ideaConferenceInclude,
    });
  }

  createConferenceWithInvites(params: {
    conference: {
      ideaId: string;
      scheduledById: string;
      title: string;
      description?: string | null;
      scheduledFor: Date;
    };
    speakerUserIds: string[];
    invitedById: string;
  }): Promise<IdeaConferenceRecord> {
    return this.prisma.$transaction(async tx => {
      const conference = await this.create(
        {
          idea: { connect: { id: params.conference.ideaId } },
          scheduledBy: { connect: { id: params.conference.scheduledById } },
          title: params.conference.title,
          description: params.conference.description ?? null,
          scheduledFor: params.conference.scheduledFor,
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
    ideaId: string,
  ): Promise<IdeaConferenceRecord | null> {
    return this.prisma.ideaConference.findFirst({
      where: { id: conferenceId, ideaId },
      include: ideaConferenceInclude,
    });
  }

  findManyByIdeaId(ideaId: string): Promise<IdeaConferenceRecord[]> {
    return this.prisma.ideaConference.findMany({
      where: { ideaId },
      include: ideaConferenceInclude,
      orderBy: [{ scheduledFor: 'desc' }],
    });
  }

  findLiveConference(ideaId: string): Promise<IdeaConferenceRecord | null> {
    return this.prisma.ideaConference.findFirst({
      where: { ideaId, status: IdeaConferenceStatus.LIVE },
      include: ideaConferenceInclude,
    });
  }

  findNextScheduledConference(
    ideaId: string,
  ): Promise<IdeaConferenceRecord | null> {
    return this.prisma.ideaConference.findFirst({
      where: {
        ideaId,
        status: IdeaConferenceStatus.SCHEDULED,
        scheduledFor: { gte: new Date() },
      },
      include: ideaConferenceInclude,
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

  findIdeaTeam(ideaId: string): Promise<IdeaTeamRecord | null> {
    return this.prisma.idea
      .findUnique({
        where: { id: ideaId },
        select: {
          authorId: true,
          author: {
            select: LIVE_CHAT_AUTHOR_SELECT,
          },
          members: {
            select: {
              user: {
                select: LIVE_CHAT_AUTHOR_SELECT,
              },
            },
          },
        },
      })
      .then(idea => {
        if (!idea) {
          return null;
        }

        return {
          authorId: idea.authorId,
          author: idea.author,
          members: idea.members.map(member => member.user),
        };
      });
  }

  findByProviderRoomName(
    providerRoomName: string,
  ): Promise<IdeaConferenceRecord | null> {
    return this.prisma.ideaConference.findFirst({
      where: { providerRoomName },
      include: ideaConferenceInclude,
    });
  }

  findIdeaAuthorId(ideaId: string): Promise<string | null> {
    return this.prisma.idea
      .findUnique({
        where: { id: ideaId },
        select: { authorId: true },
      })
      .then(idea => idea?.authorId ?? null);
  }

  findUserAuthor(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: LIVE_CHAT_AUTHOR_SELECT,
    });
  }

  updateStatus(
    conferenceId: string,
    data: Prisma.IdeaConferenceUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<IdeaConferenceRecord> {
    const client = tx ?? this.prisma;
    return client.ideaConference.update({
      where: { id: conferenceId },
      data,
      include: ideaConferenceInclude,
    });
  }
}
