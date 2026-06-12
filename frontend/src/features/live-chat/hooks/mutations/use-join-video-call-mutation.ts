import { joinVideoCall } from '@/features/live-chat/api/live-chat.api';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useJoinVideoCallMutation(roomId: string) {
  return useMutation({
    mutationFn: (callId: string) => joinVideoCall(roomId, callId),
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
