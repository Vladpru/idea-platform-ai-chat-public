import type {
  LiveChatMessageDto,
  LiveChatMessagesCache,
} from '@/features/live-chat/api/live-chat-api.types';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import { appendLiveChatMessage } from '@/features/live-chat/lib/merge-live-chat-message-cache';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { getStoredAuthToken } from '@/shared/lib/auth-token';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';

type SocketAck<T> = T | undefined;

type JoinRoomResponse = { ok: true } | { ok: false; error: string };

type SendMessageResponse =
  | { ok: true; message: LiveChatMessageDto }
  | { ok: false; error: string };

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

function emitWithAck<TPayload, TResponse>(
  socket: Socket,
  event: string,
  payload: TPayload,
): Promise<SocketAck<TResponse>> {
  return new Promise(resolve => {
    socket
      .timeout(10_000)
      .emit(event, payload, (error: Error | null, response: TResponse) => {
        if (error) {
          resolve(undefined);
          return;
        }
        resolve(response);
      });
  });
}

export function useLiveChatSocket(roomId: string | null, enabled: boolean) {
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore(state => state.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const joinedRoomIdRef = useRef<string | null>(null);

  const joinRoom = useCallback(async (socket: Socket, nextRoomId: string) => {
    const response = await emitWithAck<{ roomId: string }, JoinRoomResponse>(
      socket,
      'join_room',
      { roomId: nextRoomId },
    );

    if (!response?.ok) {
      toast.error(response?.error ?? 'Could not join live chat room');
      return false;
    }

    joinedRoomIdRef.current = nextRoomId;
    return true;
  }, []);

  const leaveRoom = useCallback(async (socket: Socket, currentRoomId: string) => {
    await emitWithAck<{ roomId: string }, { ok: true }>(socket, 'leave_room', {
      roomId: currentRoomId,
    });
    if (joinedRoomIdRef.current === currentRoomId) {
      joinedRoomIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    const activeSocket = socketRef.current;
    if (activeSocket) {
      disconnectSocket(activeSocket);
      socketRef.current = null;
      joinedRoomIdRef.current = null;
    }

    if (!enabled || !accessToken || !roomId) {
      return;
    }

    const token = getStoredAuthToken() ?? accessToken;
    const socket = io(`${getSocketBaseUrl()}/live-chat`, {
      withCredentials: true,
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const handleMessage = (message: LiveChatMessageDto) => {
      queryClient.setQueryData<LiveChatMessagesCache>(
        liveChatQueryKeys.messages(message.roomId),
        cache => appendLiveChatMessage(cache, message),
      );
    };

    const handleConnectionReady = () => {
      void joinRoom(socket, roomId);
    };

    socket.on('connection_ready', handleConnectionReady);
    socket.on('message', handleMessage);
    socketRef.current = socket;

    return () => {
      const joinedRoomId = joinedRoomIdRef.current;
      if (joinedRoomId) {
        void leaveRoom(socket, joinedRoomId);
      }
      socket.off('connection_ready', handleConnectionReady);
      socket.off('message', handleMessage);
      disconnectSocket(socket);
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      joinedRoomIdRef.current = null;
    };
  }, [accessToken, enabled, joinRoom, leaveRoom, queryClient, roomId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const socket = socketRef.current;
      if (!socket || !roomId) {
        toast.error('Live chat connection is not ready');
        return false;
      }

      if (!socket.connected) {
        toast.error('Live chat connection is not ready');
        return false;
      }

      const response = await emitWithAck<
        { roomId: string; content: string },
        SendMessageResponse
      >(socket, 'send_message', { roomId, content });

      if (!response?.ok) {
        toast.error(response?.error ?? 'Could not send message');
        return false;
      }

      queryClient.setQueryData<LiveChatMessagesCache>(
        liveChatQueryKeys.messages(roomId),
        cache => appendLiveChatMessage(cache, response.message),
      );

      return true;
    },
    [queryClient, roomId],
  );

  return { sendMessage };
}
