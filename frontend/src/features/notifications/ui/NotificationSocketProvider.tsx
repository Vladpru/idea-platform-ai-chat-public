import { useNotificationSocket } from '@/features/notifications/hooks/use-notification-socket';

export function NotificationSocketProvider() {
  useNotificationSocket();
  return null;
}
