import { updateVideoCall } from '@/features/live-chat/api/live-chat.api';
import type {
  LiveChatRoomDto,
  UpdateVideoCallPayload,
  VideoCallListResponse,
} from '@/features/live-chat/api/live-chat-api.types';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import {
  applyCallCancelled,
  applyCallEnded,
  applyCallStarted,
  patchRoomActiveCallInList,
} from '@/features/live-chat/lib/merge-video-call-cache';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type UpdateVideoCallVariables = UpdateVideoCallPayload & {
  callId: string;
};

export function useUpdateVideoCallMutation(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ callId, action }: UpdateVideoCallVariables) =>
      updateVideoCall(roomId, callId, { action }),
    onSuccess: (call, variables) => {
      queryClient.setQueryData<VideoCallListResponse>(
        liveChatQueryKeys.calls(roomId),
        cache => {
        if (variables.action === 'start') {
          return applyCallStarted(cache, call);
        }

        if (variables.action === 'end') {
          return applyCallEnded(cache, {
            callId: call.id,
            roomId: call.roomId,
          });
        }

        if (variables.action === 'cancel') {
          return applyCallCancelled(cache, {
            callId: call.id,
            roomId: call.roomId,
          });
        }

        return cache;
        },
      );

      if (variables.action === 'start') {
        queryClient.setQueryData<LiveChatRoomDto[]>(
          liveChatQueryKeys.rooms(),
          rooms => patchRoomActiveCallInList(rooms, roomId, call),
        );
        queryClient.setQueryData<LiveChatRoomDto>(
          liveChatQueryKeys.room(roomId),
          room => (room ? { ...room, activeCall: call } : room),
        );
      }

      if (variables.action === 'end') {
        queryClient.setQueryData<LiveChatRoomDto[]>(
          liveChatQueryKeys.rooms(),
          rooms => patchRoomActiveCallInList(rooms, roomId, null),
        );
        queryClient.setQueryData<LiveChatRoomDto>(
          liveChatQueryKeys.room(roomId),
          room => (room ? { ...room, activeCall: null } : room),
        );
      }
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
