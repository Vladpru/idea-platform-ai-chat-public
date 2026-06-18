import { resolveNotificationNavigationTarget } from '@/features/notifications/lib/resolve-notification-navigation';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import type { MouseEvent } from 'react';

import { cn } from '@/shared/lib/utils';

import type { NotificationDto } from '../api/notifications.types';
import {
  useDeleteNotificationMutation,
  useMarkNotificationReadMutation,
} from '../hooks/use-notifications';
import { NotificationMessage } from './NotificationMessage';

type NotificationItemProps = {
  notification: NotificationDto;
  onNavigate?: () => void;
  actionsDisabled?: boolean;
};

export function NotificationItem({
  notification,
  onNavigate,
  actionsDisabled = false,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const markAsRead = useMarkNotificationReadMutation();
  const deleteNotification = useDeleteNotificationMutation();
  const isUnread = notification.readAt === null;
  const target = resolveNotificationNavigationTarget(
    notification.type,
    notification.payload,
  );

  const handleBodyClick = () => {
    if (actionsDisabled || markAsRead.isPending || deleteNotification.isPending) {
      return;
    }

    if (isUnread) {
      markAsRead.mutate(notification.id);
    }

    if (notification.type === 'PDF_READY') {
      const downloadUrl = notification.payload['download_url'];
      if (typeof downloadUrl === 'string') {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (target) {
      onNavigate?.();
      if (target.to === '/live-chats/$roomId') {
        void navigate({
          to: target.to,
          params: target.params,
        });
      } else {
        void navigate({
          to: target.to,
          params: target.params,
          search: target.search,
        });
      }
    }
  };

  const handleDismiss = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (actionsDisabled || markAsRead.isPending || deleteNotification.isPending) {
      return;
    }

    deleteNotification.mutate(notification.id);
  };

  return (
    <div
      className={cn(
        'group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
        isUnread ? 'bg-brand-light-blue/20' : 'hover:bg-muted/60',
        (target || notification.type === 'PDF_READY') && 'cursor-pointer',
      )}
    >
      <button
        type="button"
        onClick={handleBodyClick}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span
          className={cn(
            'mt-2 size-2 shrink-0 rounded-full',
            isUnread ? 'bg-brand-dark-blue' : 'bg-transparent',
          )}
          aria-hidden
        />
        <span className="text-foreground min-w-0 flex-1 text-sm leading-snug">
          <NotificationMessage
            type={notification.type}
            payload={notification.payload}
          />
        </span>
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 rounded-sm p-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        aria-label="Dismiss notification"
        disabled={actionsDisabled || markAsRead.isPending || deleteNotification.isPending}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
