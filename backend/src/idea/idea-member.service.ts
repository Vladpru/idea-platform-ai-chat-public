import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { IdeaStatus, Prisma } from '../../generated/prisma/client';
import type { IdeaMemberModel } from '../../generated/prisma/models/IdeaMember';
import { NOTIFICATION_EVENTS } from '../notification/events/notification-event-names';
import type { SupporterAddedNotificationEvent } from '../notification/events/notification.events';
import { resolveActorDisplayName } from '../notification/lib/notification-integration.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdeaMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private ideaMemberKey(
    ideaId: string,
    userId: string,
  ): Prisma.IdeaMemberWhereUniqueInput {
    return { ideaId_userId: { ideaId, userId } };
  }

  async joinIdea(ideaId: string, userId: string): Promise<IdeaMemberModel> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      select: { authorId: true, status: true, title: true },
    });

    if (!idea) {
      throw new NotFoundException();
    }

    if (idea.status !== IdeaStatus.PUBLISHED) {
      throw new BadRequestException();
    }

    if (idea.authorId === userId) {
      throw new ConflictException();
    }

    const memberKey = this.ideaMemberKey(ideaId, userId);
    const existingMember = await this.prisma.ideaMember.findUnique({
      where: memberKey,
    });

    if (existingMember) {
      throw new ConflictException();
    }

    const member = await this.prisma.ideaMember.create({
      data: {
        ideaId,
        userId,
      },
    });

    const actorName = await resolveActorDisplayName(this.prisma, userId);

    const event: SupporterAddedNotificationEvent = {
      recipientUserId: idea.authorId,
      entityType: 'idea',
      entityId: ideaId,
      entityTitle: idea.title ?? 'Untitled',
      actorId: userId,
      actorName,
    };

    this.eventEmitter.emit(NOTIFICATION_EVENTS.IDEA_SUPPORTER_ADDED, event);

    return member;
  }

  async leaveIdea(ideaId: string, userId: string): Promise<IdeaMemberModel> {
    const memberKey = this.ideaMemberKey(ideaId, userId);
    const member = await this.prisma.ideaMember.findUnique({
      where: memberKey,
    });

    if (!member) {
      throw new NotFoundException();
    }

    return this.prisma.ideaMember.delete({
      where: memberKey,
    });
  }
}
