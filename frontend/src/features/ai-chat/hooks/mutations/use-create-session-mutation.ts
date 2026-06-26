import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { createSession } from '../../api/ai-chat.api';
import type { ChatSession } from '../../api/ai-chat.types';
import { aiChatQueryKeys } from '../../model/ai-chat-query-keys';

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (_vars?: { initialMessage?: string }) => createSession(),
    onSuccess: (session, vars) => {
      queryClient.setQueryData<ChatSession[]>(
        aiChatQueryKeys.sessions(),
        prev => [session, ...(prev ?? [])],
      );
      navigate({
        to: '/ai-chat/$sessionId',
        params: { sessionId: session.id },
        search: vars?.initialMessage ? { q: vars.initialMessage } : {},
      });
      queryClient.invalidateQueries({ queryKey: aiChatQueryKeys.sessions() });
    },
  });
}
