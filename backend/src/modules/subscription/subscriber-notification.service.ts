import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NOTIFICATION_EVENTS } from '../notification/events/notification-event-names';
import { resolveActorDisplayName } from '../notification/lib/notification-integration.util';
import { NotificationGateway } from '../notification/notification.gateway';

type NewPublicationEntityType = 'idea' | 'problem';

@Injectable()
export class SubscriberNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async getFollowingIds(followerId: string): Promise<string[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { followerId },
      select: { followingId: true },
    });

    return rows.map(row => row.followingId);
  }

  async notifySubscribersOfNewPublication(params: {
    authorId: string;
    entityType: NewPublicationEntityType;
    entityId: string;
    entityTitle: string;
  }): Promise<void> {
    const followers = await this.prisma.subscription.findMany({
      where: { followingId: params.authorId },
      select: { followerId: true },
    });

    if (followers.length === 0) {
      return;
    }

    const actorName = await resolveActorDisplayName(
      this.prisma,
      params.authorId,
    );
    const notificationType =
      params.entityType === 'idea'
        ? NOTIFICATION_EVENTS.NEW_IDEA
        : NOTIFICATION_EVENTS.NEW_PROBLEM;

    const resolvedTitle =
      params.entityTitle.trim() ||
      (params.entityType === 'idea' ? 'Untitled idea' : 'Untitled problem');

    const payload: Prisma.InputJsonValue =
      params.entityType === 'idea'
        ? {
            ideaId: params.entityId,
            ideaTitle: resolvedTitle,
            actorId: params.authorId,
            actorName,
          }
        : {
            problemId: params.entityId,
            problemTitle: resolvedTitle,
            actorId: params.authorId,
            actorName,
          };

    await this.prisma.notification.createMany({
      data: followers.map(follower => ({
        userId: follower.followerId,
        type: notificationType,
        payload,
      })),
    });

    for (const follower of followers) {
      this.gateway.notifyUser(follower.followerId);
    }
  }
}
