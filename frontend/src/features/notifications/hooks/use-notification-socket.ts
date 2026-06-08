import { notificationQueryKeys } from '@/features/notifications/lib/notification-query-keys';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { getStoredAuthToken } from '@/shared/lib/auth-token';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

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

    socket.on('notification', handleNotification);
    socketRef.current = socket;

    return () => {
      socket.off('notification', handleNotification);
      disconnectSocket(socket);
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [accessToken, queryClient]);
}
