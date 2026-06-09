import { createLiveChatRoom } from '@/features/live-chat/api/live-chat.api';
import type { CreateLiveChatRoomPayload } from '@/features/live-chat/api/live-chat-api.types';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCreateLiveChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLiveChatRoomPayload) =>
      createLiveChatRoom(payload),
    onSuccess: room => {
      void queryClient.invalidateQueries({ queryKey: liveChatQueryKeys.rooms() });
      queryClient.setQueryData(liveChatQueryKeys.room(room.id), room);
      queryClient.setQueryData(
        liveChatQueryKeys.roomByEntity(room.entity.type, room.entity.id),
        room,
      );
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
