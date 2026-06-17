import type {
  LiveChatAttachmentPayload,
  LiveChatMessageDto,
  LiveChatMessagesCache,
  LiveChatRoomDto,
  VideoCallDto,
  VideoCallLifecyclePayload,
  VideoCallListResponse,
} from '@/features/live-chat/api/live-chat-api.types';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import { appendLiveChatMessage } from '@/features/live-chat/lib/merge-live-chat-message-cache';
import {
  getPendingMessages,
  localMessageToDto,
  saveOutgoingMessage,
  saveSyncedMessage,
} from '@/features/live-chat/lib/offline-chat-queue';
import {
  applyCallCancelled,
  applyCallEnded,
  applyCallScheduled,
  applyCallStarted,
  patchRoomActiveCallInList,
} from '@/features/live-chat/lib/merge-video-call-cache';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { getStoredAuthToken } from '@/shared/lib/auth-token';
import { uuidv7 } from '@/shared/offline/id';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';

type SocketAck<T> = T | undefined;

type JoinRoomResponse = { ok: true } | { ok: false; error: string };

type SendMessageResponse =
  | { ok: true; message: LiveChatMessageDto }
  | { ok: false; error: string };

type SendMessagePayload = {
  roomId: string;
  clientMessageId: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
};

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
  const flushingRef = useRef(false);

  const flushPending = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket?.connected || !roomId || flushingRef.current) {
      return;
    }

    flushingRef.current = true;
    try {
      const pending = await getPendingMessages(roomId);
      for (const row of pending) {
        const dto = localMessageToDto(row);
        const payload: SendMessagePayload = {
          roomId: row.roomId,
          clientMessageId: row.clientMessageId,
          content: row.content,
        };
        if (dto.attachmentUrl) {
          payload.attachmentUrl = dto.attachmentUrl;
          payload.attachmentName = dto.attachmentName ?? undefined;
          payload.attachmentMimeType = dto.attachmentMimeType ?? undefined;
        }

        const response = await emitWithAck<
          SendMessagePayload,
          SendMessageResponse
        >(socket, 'send_message', payload);

        if (response?.ok) {
          await saveSyncedMessage(response.message);
          queryClient.setQueryData<LiveChatMessagesCache>(
            liveChatQueryKeys.messages(row.roomId),
            cache => appendLiveChatMessage(cache, response.message),
          );
        }
      }
    } finally {
      flushingRef.current = false;
    }
  }, [queryClient, roomId]);

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
      void saveSyncedMessage(message);
    };

    const handleConnect = () => {
      void flushPending();
    };

    const patchVideoCalls = (
      targetRoomId: string,
      updater: (
        cache: VideoCallListResponse | undefined,
      ) => VideoCallListResponse,
    ) => {
      queryClient.setQueryData<VideoCallListResponse>(
        liveChatQueryKeys.calls(targetRoomId),
        cache => updater(cache),
      );
    };

    const patchHubRoomActiveCall = (
      targetRoomId: string,
      activeCall: VideoCallDto | null,
    ) => {
      queryClient.setQueryData<LiveChatRoomDto[]>(
        liveChatQueryKeys.rooms(),
        rooms => patchRoomActiveCallInList(rooms, targetRoomId, activeCall),
      );
      queryClient.setQueryData<LiveChatRoomDto>(
        liveChatQueryKeys.room(targetRoomId),
        room => (room ? { ...room, activeCall } : room),
      );
    };

    const handleCallScheduled = (call: VideoCallDto) => {
      if (call.roomId !== roomId) {
        return;
      }

      patchVideoCalls(call.roomId, cache => applyCallScheduled(cache, call));
    };

    const handleCallStarted = (call: VideoCallDto) => {
      if (call.roomId !== roomId) {
        return;
      }

      patchVideoCalls(call.roomId, cache => applyCallStarted(cache, call));
      patchHubRoomActiveCall(call.roomId, call);
    };

    const handleCallEnded = (payload: VideoCallLifecyclePayload) => {
      if (payload.roomId !== roomId) {
        return;
      }

      patchVideoCalls(payload.roomId, cache => applyCallEnded(cache, payload));
      patchHubRoomActiveCall(payload.roomId, null);
    };

    const handleCallCancelled = (payload: VideoCallLifecyclePayload) => {
      if (payload.roomId !== roomId) {
        return;
      }

      patchVideoCalls(payload.roomId, cache =>
        applyCallCancelled(cache, payload),
      );
    };

    const handleConnectionReady = () => {
      void joinRoom(socket, roomId);
    };

    socket.on('connect', handleConnect);
    socket.on('connection_ready', handleConnectionReady);
    socket.on('message', handleMessage);
    socket.on('call_scheduled', handleCallScheduled);
    socket.on('call_started', handleCallStarted);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_cancelled', handleCallCancelled);
    socketRef.current = socket;

    return () => {
      const joinedRoomId = joinedRoomIdRef.current;
      if (joinedRoomId) {
        void leaveRoom(socket, joinedRoomId);
      }
      socket.off('connect', handleConnect);
      socket.off('connection_ready', handleConnectionReady);
      socket.off('message', handleMessage);
      socket.off('call_scheduled', handleCallScheduled);
      socket.off('call_started', handleCallStarted);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_cancelled', handleCallCancelled);
      disconnectSocket(socket);
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      joinedRoomIdRef.current = null;
    };
  }, [accessToken, enabled, flushPending, joinRoom, leaveRoom, queryClient, roomId]);

  const sendMessage = useCallback(
    async (content: string, attachment?: LiveChatAttachmentPayload | null) => {
      if (!roomId) {
        toast.error('Live chat connection is not ready');
        return null;
      }

      const user = useAuthSessionStore.getState().user;
      if (!user) {
        toast.error('You must be signed in to send messages');
        return null;
      }

      const clientMessageId = uuidv7();
      const optimistic: LiveChatMessageDto = {
        id: clientMessageId,
        roomId,
        clientMessageId,
        content,
        attachmentUrl: attachment?.url ?? null,
        attachmentName: attachment?.name ?? null,
        attachmentMimeType: attachment?.mimeType ?? null,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.picture,
        },
        createdAt: new Date().toISOString(),
      };

      // Durable optimistic write first; delivery is best-effort from here.
      await saveOutgoingMessage(optimistic);
      queryClient.setQueryData<LiveChatMessagesCache>(
        liveChatQueryKeys.messages(roomId),
        cache => appendLiveChatMessage(cache, optimistic),
      );

      const socket = socketRef.current;
      if (socket?.connected && navigator.onLine) {
        void flushPending();
      }

      return optimistic;
    },
    [flushPending, queryClient, roomId],
  );

  return { sendMessage };
}
