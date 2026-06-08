import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { Prisma } from '../../generated/prisma/client';
import type { NotificationEmailJobData } from '../mail/types/notification-email.types';
import { PrismaService } from '../prisma/prisma.service';
import {
  NOTIFICATION_EMAIL_JOB_OPTIONS,
  NOTIFICATION_EMAIL_QUEUE,
} from './constants/notification-queue.constants';
import type { NotificationDispatchInput } from './events/notification.events';
import {
  getChannelPreferences,
  parseNotificationPreferences,
} from './lib/notification-preferences.util';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
    @InjectQueue(NOTIFICATION_EMAIL_QUEUE)
    private readonly emailQueue: Queue<NotificationEmailJobData>,
  ) {}

  async dispatch(input: NotificationDispatchInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.recipientUserId },
      select: {
        id: true,
        email: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      this.logger.warn(
        `Skipping notification dispatch for missing user ${input.recipientUserId}`,
      );
      return;
    }

    const preferences = parseNotificationPreferences(
      user.notificationPreferences,
    );
    const channels = getChannelPreferences(preferences, input.preferenceKey);
    const payload = input.payload as Prisma.InputJsonValue;

    if (channels.inApp) {
      try {
        const duplicate = await this.prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: input.notificationType,
            payload: { equals: payload },
          },
          select: { id: true },
        });

        if (!duplicate) {
          await this.prisma.notification.create({
            data: {
              userId: user.id,
              type: input.notificationType,
              payload,
            },
          });
          this.gateway.notifyUser(user.id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to dispatch in-app notification for user ${user.id}`,
          error,
        );
      }
    }

    if (channels.email) {
      try {
        const jobData: NotificationEmailJobData = {
          to: user.email,
          preferenceKey: input.preferenceKey,
          notificationType: input.notificationType,
          payload: input.payload,
        };

        await this.emailQueue.add(
          input.notificationType,
          jobData,
          NOTIFICATION_EMAIL_JOB_OPTIONS,
        );
      } catch (error) {
        this.logger.error(
          `Failed to add email notification to queue for user ${user.id}`,
          error,
        );
      }
    }
  }
}
