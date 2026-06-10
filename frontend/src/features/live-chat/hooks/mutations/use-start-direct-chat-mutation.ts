import { createDirectLiveChatRoom } from '@/features/live-chat/api/live-chat.api';
import { liveChatQueryKeys } from '@/features/live-chat/lib/live-chat-query-keys';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export function useStartDirectChatMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => createDirectLiveChatRoom(userId),
    onSuccess: room => {
      void queryClient.invalidateQueries({ queryKey: liveChatQueryKeys.rooms() });
      queryClient.setQueryData(liveChatQueryKeys.room(room.id), room);
      void navigate({
        to: '/live-chats/$roomId',
        params: { roomId: room.id },
      });
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
