import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { createSession } from '../../api/ai-chat.api';
import { aiChatQueryKeys } from '../../model/ai-chat-query-keys';

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createSession,
    onSuccess: async session => {
      await queryClient.invalidateQueries({ queryKey: aiChatQueryKeys.sessions() });
      navigate({ to: '/ai-chat/$sessionId', params: { sessionId: session.id } });
    },
  });
}
