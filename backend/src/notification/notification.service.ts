import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NOTIFICATION_LIST_MAX } from './notification.constants';
import { toNotificationDto } from './notification.mapper';
import type {
  NotificationDto,
  PaginatedNotificationsResponse,
  UnreadCountResponse,
} from './types/notification.types';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: GetNotificationsQueryDto,
  ): Promise<PaginatedNotificationsResponse> {
    const limit = Math.max(
      1,
      Math.min(query.limit ?? NOTIFICATION_LIST_MAX, NOTIFICATION_LIST_MAX),
    );

    if (query.cursor) {
      const cursorRow = await this.prisma.notification.findFirst({
        where: { id: query.cursor, userId },
        select: { id: true },
      });

      if (!cursorRow) {
        throw new BadRequestException('Invalid notification cursor');
      }
    }

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      take: limit + 1,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const hasNextPage = notifications.length > limit;
    const data = hasNextPage ? notifications.slice(0, -1) : notifications;

    return {
      data: data.map(toNotificationDto),
      meta: {
        limit,
        hasNextPage,
        nextCursor: hasNextPage ? data[data.length - 1].id : null,
      },
    };
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return { count };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationDto> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      const existing = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!existing) {
        throw new NotFoundException('Notification not found');
      }

      return toNotificationDto(existing);
    }

    const updated = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    return toNotificationDto(updated);
  }

  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  }

  async delete(userId: string, notificationId: string): Promise<void> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async deleteAll(userId: string): Promise<{ deletedCount: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return { deletedCount: result.count };
  }
}
