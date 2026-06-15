import { Injectable } from '@nestjs/common';

import {
  ConferenceInviteStatus,
  ConferenceInviteType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ConferenceInviteRecord = Prisma.ConferenceInviteGetPayload<{
  select: typeof conferenceInviteSelect;
}>;

export const conferenceInviteSelect = {
  id: true,
  conferenceId: true,
  invitedById: true,
  inviteType: true,
  status: true,
  userId: true,
  email: true,
  tokenHash: true,
  expiresAt: true,
  acceptedAt: true,
  createdAt: true,
} satisfies Prisma.ConferenceInviteSelect;

export type ConferenceInvitePreviewRecord = {
  id: string;
  email: string | null;
  tokenHash: string | null;
  expiresAt: Date | null;
  status: ConferenceInviteStatus;
  conference: {
    title: string;
    scheduledFor: Date;
    idea: {
      title: string | null;
    };
  };
};

@Injectable()
export class ConferenceInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPlatformInvite(data: {
    conferenceId: string;
    invitedById: string;
    userId: string;
  }): Promise<ConferenceInviteRecord> {
    return this.prisma.conferenceInvite.create({
      data: {
        conferenceId: data.conferenceId,
        invitedById: data.invitedById,
        inviteType: ConferenceInviteType.PLATFORM_USER,
        status: ConferenceInviteStatus.PENDING,
        userId: data.userId,
      },
      select: conferenceInviteSelect,
    });
  }

  createExternalInvite(data: {
    conferenceId: string;
    invitedById: string;
    email: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<ConferenceInviteRecord> {
    return this.prisma.conferenceInvite.create({
      data: {
        conferenceId: data.conferenceId,
        invitedById: data.invitedById,
        inviteType: ConferenceInviteType.EXTERNAL_EMAIL,
        status: ConferenceInviteStatus.PENDING,
        email: data.email,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
      select: conferenceInviteSelect,
    });
  }

  findById(inviteId: string): Promise<ConferenceInviteRecord | null> {
    return this.prisma.conferenceInvite.findUnique({
      where: { id: inviteId },
      select: conferenceInviteSelect,
    });
  }

  findPreviewById(
    inviteId: string,
  ): Promise<ConferenceInvitePreviewRecord | null> {
    return this.prisma.conferenceInvite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        email: true,
        tokenHash: true,
        expiresAt: true,
        status: true,
        conference: {
          select: {
            title: true,
            scheduledFor: true,
            idea: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });
  }

  findAcceptedInviteForUser(
    conferenceId: string,
    userId: string,
  ): Promise<ConferenceInviteRecord | null> {
    return this.prisma.conferenceInvite.findFirst({
      where: {
        conferenceId,
        userId,
        status: ConferenceInviteStatus.ACCEPTED,
      },
      select: conferenceInviteSelect,
    });
  }

  findAnyInviteForUser(
    conferenceId: string,
    userId: string,
  ): Promise<ConferenceInviteRecord | null> {
    return this.prisma.conferenceInvite.findFirst({
      where: {
        conferenceId,
        userId,
      },
      select: conferenceInviteSelect,
    });
  }

  acceptInvite(
    inviteId: string,
    userId: string,
  ): Promise<ConferenceInviteRecord> {
    return this.prisma.conferenceInvite.update({
      where: { id: inviteId },
      data: {
        userId,
        status: ConferenceInviteStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      select: conferenceInviteSelect,
    });
  }

  async deleteInvite(inviteId: string): Promise<void> {
    await this.prisma.conferenceInvite.delete({ where: { id: inviteId } });
  }

  findUserEmail(userId: string): Promise<string | null> {
    return this.prisma.user
      .findUnique({
        where: { id: userId },
        select: { email: true },
      })
      .then(user => user?.email ?? null);
  }

  findUserById(userId: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  }
}
