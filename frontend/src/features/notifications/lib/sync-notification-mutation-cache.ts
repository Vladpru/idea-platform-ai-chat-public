import type { InfiniteData } from '@tanstack/react-query';

import type {
  NotificationDto,
  PaginatedNotificationsResponse,
} from '../api/notifications.types';
import { NOTIFICATIONS_LIST_LIMIT } from './notification-list.constants';

export type NotificationListSnapshot =
  | InfiniteData<PaginatedNotificationsResponse>
  | undefined;

export function findNotificationInInfiniteData(
  data: NotificationListSnapshot,
  notificationId: string,
): NotificationDto | undefined {
  if (!data) {
    return undefined;
  }

  for (const page of data.pages) {
    const match = page.data.find(
      notification => notification.id === notificationId,
    );
    if (match) {
      return match;
    }
  }

  return undefined;
}

export function mapNotificationListPages(
  data: InfiniteData<PaginatedNotificationsResponse>,
  mapper: (
    page: PaginatedNotificationsResponse,
    index: number,
  ) => PaginatedNotificationsResponse,
): InfiniteData<PaginatedNotificationsResponse> {
  return {
    ...data,
    pages: data.pages.map(mapper),
  };
}

export function emptyNotificationListSnapshot(
  limit = NOTIFICATIONS_LIST_LIMIT,
): InfiniteData<PaginatedNotificationsResponse> {
  return {
    pages: [
      {
        data: [],
        meta: {
          limit,
          hasNextPage: false,
          nextCursor: null,
        },
      },
    ],
    pageParams: [undefined],
  };
}
