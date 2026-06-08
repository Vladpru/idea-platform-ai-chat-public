import { api } from '@/shared/api/http';

import { NOTIFICATIONS_LIST_LIMIT } from '../lib/notification-list.constants';
import type {
  FetchNotificationsParams,
  NotificationDto,
  PaginatedNotificationsResponse,
  UnreadCountResponse,
} from './notifications.types';

export async function fetchNotifications(
  params: FetchNotificationsParams = {},
): Promise<PaginatedNotificationsResponse> {
  const limit = Math.min(
    params.limit ?? NOTIFICATIONS_LIST_LIMIT,
    NOTIFICATIONS_LIST_LIMIT,
  );

  const { data } = await api.get<PaginatedNotificationsResponse>(
    '/notifications',
    {
      params: {
        cursor: params.cursor,
        limit,
      },
    },
  );
  return data;
}

export async function fetchUnreadNotificationCount(): Promise<UnreadCountResponse> {
  const { data } = await api.get<UnreadCountResponse>(
    '/notifications/unread-count',
  );
  return data;
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<NotificationDto> {
  const { data } = await api.patch<NotificationDto>(
    `/notifications/${notificationId}/read`,
  );
  return data;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}

export async function markAllNotificationsAsRead(): Promise<{
  updatedCount: number;
}> {
  const { data } = await api.patch<{ updatedCount: number }>(
    '/notifications/read-all',
  );
  return data;
}

export async function deleteAllNotifications(): Promise<{
  deletedCount: number;
}> {
  const { data } = await api.delete<{ deletedCount: number }>(
    '/notifications/all',
  );
  return data;
}
