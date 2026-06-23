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

type SendMessagePayload = {
  roomId: string;
  clientMessageId: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
};

type RoomJoinResult = {
  roomId: string;
  clientMsgId?: string;
  reason?: string;
};

function getRealtimeEdgeUrl(): string {
  const base =
    import.meta.env.VITE_REALTIME_EDGE_URL ?? import.meta.env.VITE_API_URL;
  if (typeof base !== 'string' || base.length === 0) {
    throw new Error('VITE_REALTIME_EDGE_URL (or VITE_API_URL) is not set');
  }
  return base.replace(/\/$/, '');
}

export function useLiveChatSocket(roomId: string | null, enabled: boolean) {
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore(state => state.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const joinedRoomIdRef = useRef<string | null>(null);
  const joinApprovedRef = useRef(false);
  const flushingRef = useRef(false);
  const roomIdRef = useRef<string | null>(roomId);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const flushPending = useCallback(async () => {
    const socket = socketRef.current;
    const currentRoomId = roomIdRef.current;
    if (
      !socket?.connected ||
      !currentRoomId ||
      !joinApprovedRef.current ||
      flushingRef.current
    ) {
      return;
    }

    flushingRef.current = true;
    try {
      const pending = await getPendingMessages(currentRoomId);
      for (const row of pending) {
        const attachmentUrl = row.snapshot.attachmentUrl as
          | string
          | null
          | undefined;
        const attachmentName = row.snapshot.attachmentName as
          | string
          | null
          | undefined;
        const attachmentMimeType = row.snapshot.attachmentMimeType as
          | string
          | null
          | undefined;
        const payload: SendMessagePayload = {
          roomId: row.roomId,
          clientMessageId: row.clientMessageId,
          content: row.content,
        };
        if (attachmentUrl) {
          payload.attachmentUrl = attachmentUrl;
          payload.attachmentName = attachmentName ?? undefined;
          payload.attachmentMimeType = attachmentMimeType ?? undefined;
        }
        console.log('[ws] EMIT send_message ->', {
          connected: socket.connected,
          joinApproved: joinApprovedRef.current,
          clientMessageId: payload.clientMessageId,
        });
        socket.emit('send_message', payload);
      }
    } finally {
      flushingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !accessToken || !roomId) {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(`${getRealtimeEdgeUrl()}/live-chat`, {
        autoConnect: false,
        withCredentials: true,
        auth: (cb: (data: object) => void) => {
          cb({
            token:
              getStoredAuthToken() ??
              useAuthSessionStore.getState().accessToken ??
              '',
          });
        },
        transports: ['websocket'],
      });
    }

    const socket = socketRef.current;

    const handleMessage = (message: LiveChatMessageDto) => {
      console.log(
        '[ws] message received <-',
        message.clientMessageId,
        message.content,
      );
      queryClient.setQueryData<LiveChatMessagesCache>(
        liveChatQueryKeys.messages(message.roomId),
        cache => appendLiveChatMessage(cache, message),
      );
      void saveSyncedMessage(message);
    };

    const handleConnect = () => {
      console.log('[ws] connect', socket.id);
    };

    const handleConnectError = (err: Error) => {
      console.log('[ws] connect_error:', err.message);
    };

    const handleConnectionReady = () => {
      console.log('[ws] connection_ready -> emit join_room', roomId);
      joinApprovedRef.current = false;
      socket.emit('join_room', { roomId });
    };

    const handleJoinApproved = () => {
      console.log('[ws] JOIN APPROVED', roomId);
      joinApprovedRef.current = true;
      joinedRoomIdRef.current = roomId;
      void flushPending();
    };

    const handleJoinDenied = (result: RoomJoinResult) => {
      console.log('[ws] JOIN DENIED:', result?.reason);
      joinApprovedRef.current = false;
      joinedRoomIdRef.current = null;
      toast.error(result?.reason ?? 'Could not join live chat room');
    };

    const handleDisconnect = (reason: string) => {
      console.log('[ws] disconnect:', reason);
      joinApprovedRef.current = false;
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
      if (call.roomId !== roomId) return;
      patchVideoCalls(call.roomId, cache => applyCallScheduled(cache, call));
    };

    const handleCallStarted = (call: VideoCallDto) => {
      if (call.roomId !== roomId) return;
      patchVideoCalls(call.roomId, cache => applyCallStarted(cache, call));
      patchHubRoomActiveCall(call.roomId, call);
    };

    const handleCallEnded = (payload: VideoCallLifecyclePayload) => {
      if (payload.roomId !== roomId) return;
      patchVideoCalls(payload.roomId, cache => applyCallEnded(cache, payload));
      patchHubRoomActiveCall(payload.roomId, null);
    };

    const handleCallCancelled = (payload: VideoCallLifecyclePayload) => {
      if (payload.roomId !== roomId) return;
      patchVideoCalls(payload.roomId, cache =>
        applyCallCancelled(cache, payload),
      );
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('connection_ready', handleConnectionReady);
    socket.on('room:join_approved', handleJoinApproved);
    socket.on('room:join_denied', handleJoinDenied);
    socket.on('disconnect', handleDisconnect);
    socket.on('message', handleMessage);
    socket.on('call_scheduled', handleCallScheduled);
    socket.on('call_started', handleCallStarted);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_cancelled', handleCallCancelled);

    if (socket.connected) {
      joinApprovedRef.current = false;
      socket.emit('join_room', { roomId });
    } else {
      socket.connect();
    }

    return () => {
      const joinedRoomId = joinedRoomIdRef.current;
      if (joinedRoomId && socket.connected) {
        socket.emit('leave_room', { roomId: joinedRoomId });
      }
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('connection_ready', handleConnectionReady);
      socket.off('room:join_approved', handleJoinApproved);
      socket.off('room:join_denied', handleJoinDenied);
      socket.off('disconnect', handleDisconnect);
      socket.off('message', handleMessage);
      socket.off('call_scheduled', handleCallScheduled);
      socket.off('call_started', handleCallStarted);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_cancelled', handleCallCancelled);
      socket.disconnect();
      socketRef.current = null;
      joinedRoomIdRef.current = null;
      joinApprovedRef.current = false;
    };
  }, [accessToken, enabled, flushPending, queryClient, roomId]);

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
        pending: true,
      };

      await saveOutgoingMessage(optimistic);
      queryClient.setQueryData<LiveChatMessagesCache>(
        liveChatQueryKeys.messages(roomId),
        cache => appendLiveChatMessage(cache, optimistic),
      );

      const socket = socketRef.current;
      if (socket?.connected && navigator.onLine && joinApprovedRef.current) {
        void flushPending();
      }

      return optimistic;
    },
    [flushPending, queryClient, roomId],
  );

  return { sendMessage };
}
