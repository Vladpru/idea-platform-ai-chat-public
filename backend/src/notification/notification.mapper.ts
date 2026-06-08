import type { NotificationRecord } from './types/notification.types';
import type { NotificationDto } from './types/notification.types';

export function toNotificationDto(
  notification: NotificationRecord,
): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    payload: notification.payload,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}
