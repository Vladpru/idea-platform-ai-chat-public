import { createVideoCall } from '@/features/live-chat/api/live-chat.api';
import type {
  CreateVideoCallPayload,
  LiveChatRoomDto,
  VideoCallListResponse,
} from '@/features/live-chat/api/live-chat-api.types';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import {
  applyCallScheduled,
  applyCallStarted,
  patchRoomActiveCallInList,
} from '@/features/live-chat/lib/merge-video-call-cache';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCreateVideoCallMutation(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVideoCallPayload = {}) =>
      createVideoCall(roomId, payload),
    onSuccess: call => {
      queryClient.setQueryData<VideoCallListResponse>(
        liveChatQueryKeys.calls(roomId),
        cache => {
          if (call.status === 'SCHEDULED') {
            return applyCallScheduled(cache, call);
          }

          if (call.status === 'ACTIVE') {
            return applyCallStarted(cache, call);
          }

          return cache;
        },
      );

      if (call.status === 'ACTIVE') {
        queryClient.setQueryData<LiveChatRoomDto[]>(
          liveChatQueryKeys.rooms(),
          rooms => patchRoomActiveCallInList(rooms, roomId, call),
        );
        queryClient.setQueryData<LiveChatRoomDto>(
          liveChatQueryKeys.room(roomId),
          room => (room ? { ...room, activeCall: call } : room),
        );
      }
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
