import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteSession } from '../../api/ai-chat.api';
import { aiChatQueryKeys } from '../../model/ai-chat-query-keys';

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: (_data, sessionId) => {
      queryClient.setQueryData(
        aiChatQueryKeys.sessions(),
        (prev: { id: string }[] = []) => prev.filter(s => s.id !== sessionId),
      );
      queryClient.removeQueries({ queryKey: aiChatQueryKeys.messages(sessionId) });
    },
  });
}
