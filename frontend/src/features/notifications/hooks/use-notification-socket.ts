import { BADGE_EARNED_MESSAGES } from '@/features/achievements/lib/badge-icons';
import { BadgeToast } from '@/features/achievements/ui/BadgeToast';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { notificationQueryKeys } from '@/features/notifications/lib/notification-query-keys';
import { useNotificationUiStore } from '@/features/notifications/model/notification-ui-store';
import { usePdfExportStore } from '@/features/pdf/model/pdf-export-store';
import { useQueryClient } from '@tanstack/react-query';
import { createElement, useEffect, useRef } from 'react';
import { type Socket, io } from 'socket.io-client';
import { toast } from 'sonner';

function getSocketBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL;
  if (typeof base !== 'string' || base.length === 0) {
    throw new Error('VITE_API_URL is not set');
  }
  return base.replace(/\/$/, '');
}

type AchievementBadgePayload = {
  key: string;
  name: string;
  iconPath: string;
};

type PdfReadyPayload = {
  download_url: string;
  expires_at: string;
  entity_type: 'idea' | 'problem';
  entity_id: string;
  title: string;
};

type PdfFailedPayload = {
  entity_type: string;
  entity_id: string;
};

export function useNotificationSocket(): void {
  const queryClient = useQueryClient();
  const userId = useAuthSessionStore(state => state.user?.id ?? null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      socketRef.current?.disconnect();
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(getSocketBaseUrl(), {
        autoConnect: false,
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
    }

    const socket = socketRef.current;
    const setHasNewNotification =
      useNotificationUiStore.getState().setHasNewNotification;
    const finishExport = usePdfExportStore.getState().finishExport;

    const handleNotification = () => {
      setHasNewNotification(true);
      queryClient.setQueryData<{ count: number }>(
        notificationQueryKeys.unreadCount(),
        prev => (prev ? { count: prev.count + 1 } : { count: 1 }),
      );
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    };

    const handleAchievementUnlocked = (badge: AchievementBadgePayload) => {
      const description =
        BADGE_EARNED_MESSAGES[badge.key] ??
        `You've earned the ${badge.name} badge!`;
      toast.custom(
        () =>
          createElement(BadgeToast, {
            name: badge.name,
            badgeKey: badge.key,
            description,
          }),
        { duration: 6000 },
      );
      void queryClient.invalidateQueries({ queryKey: ['achievements', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    };

    const handlePdfReady = (payload: PdfReadyPayload) => {
      finishExport(payload.entity_id);
      toast.success(`Your PDF is ready: "${payload.title}"`, {
        duration: 10000,
        action: {
          label: 'Download',
          onClick: () => {
            window.open(payload.download_url, '_blank', 'noopener,noreferrer');
          },
        },
      });
    };

    const handlePdfFailed = (payload: PdfFailedPayload) => {
      finishExport(payload.entity_id);
      toast.error(
        `PDF generation failed for your ${payload.entity_type}. Please try again later.`,
        { duration: 8000 },
      );
    };

    socket.on('notification', handleNotification);
    socket.on('achievement_unlocked', handleAchievementUnlocked);
    socket.on('pdf:ready', handlePdfReady);
    socket.on('pdf:failed', handlePdfFailed);

    socket.connect();

    return () => {
      socket.off('notification', handleNotification);
      socket.off('achievement_unlocked', handleAchievementUnlocked);
      socket.off('pdf:ready', handlePdfReady);
      socket.off('pdf:failed', handlePdfFailed);
      socket.disconnect();
    };
  }, [userId, queryClient]);
}
