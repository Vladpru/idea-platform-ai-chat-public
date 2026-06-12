import { markAchievementsSeen } from '@/features/achievements/api/achievements.api';
import { BADGE_EARNED_MESSAGES } from '@/features/achievements/lib/badge-icons';
import { BadgeToast } from '@/features/achievements/ui/BadgeToast';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { notificationQueryKeys } from '@/features/notifications/lib/notification-query-keys';
import { useQueryClient } from '@tanstack/react-query';
import { createElement, useEffect, useRef } from 'react';
import { type Socket, io } from 'socket.io-client';
import { toast } from 'sonner';

import { getStoredAuthToken } from '@/shared/lib/auth-token';

function getSocketBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL;
  if (typeof base !== 'string' || base.length === 0) {
    throw new Error('VITE_API_URL is not set');
  }
  return base.replace(/\/$/, '');
}

function disconnectSocket(socket: Socket): void {
  socket.removeAllListeners();
  socket.disconnect();
}

type AchievementBadgePayload = {
  key: string;
  name: string;
  iconPath: string;
};

export function useNotificationSocket(): void {
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore(state => state.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const activeSocket = socketRef.current;
    if (activeSocket) {
      disconnectSocket(activeSocket);
      socketRef.current = null;
    }

    if (!accessToken) {
      return;
    }

    const token = getStoredAuthToken() ?? accessToken;
    const socket = io(getSocketBaseUrl(), {
      withCredentials: true,
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const handleNotification = () => {
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
      void markAchievementsSeen();
      void queryClient.invalidateQueries({ queryKey: ['achievements', 'me'] });
    };

    socket.on('notification', handleNotification);
    socket.on('achievement_unlocked', handleAchievementUnlocked);
    socketRef.current = socket;

    return () => {
      socket.off('notification', handleNotification);
      socket.off('achievement_unlocked', handleAchievementUnlocked);
      disconnectSocket(socket);
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [accessToken, queryClient]);
}
