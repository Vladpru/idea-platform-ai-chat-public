import type { Prisma } from '../../../../generated/prisma/client';

export type NotificationRecord = {
  id: string;
  userId: string;
  type: string;
  payload: Prisma.JsonValue;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationDto = {
  id: string;
  type: string;
  payload: Prisma.JsonValue;
  readAt: string | null;
  createdAt: string;
};

export type PaginatedNotificationsMeta = {
  limit: number;
  hasNextPage: boolean;
  nextCursor: string | null;
};

export type PaginatedNotificationsResponse = {
  data: NotificationDto[];
  meta: PaginatedNotificationsMeta;
};

export type UnreadCountResponse = {
  count: number;
};

export type NotificationSignalEvent = {
  type: 'NOTIFICATION_NEW';
};
