import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { streamChatMessage } from '../api/ai-chat.stream';
import type { ChatIntent, ChatMessage } from '../api/ai-chat.types';
import { aiChatQueryKeys } from '../model/ai-chat-query-keys';
import {
  EMPTY_SESSION,
  useChatStreamStore,
  deleteStreamController,
  getStreamController,
  setStreamController,
} from '../model/chat-stream-store';

export function useChatStream(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    useChatStreamStore.getState().initSession(sessionId);
  }, [sessionId]);

  const session = useChatStreamStore(state => state.sessions[sessionId] ?? EMPTY_SESSION);

  const send = useCallback(
    async (message: string) => {
      const storeState = useChatStreamStore.getState();
      if (storeState.sessions[sessionId]?.isStreaming) return;

      storeState.setStreaming(sessionId, true);
      storeState.setSuggestions(sessionId, []);

      await queryClient.cancelQueries({ queryKey: aiChatQueryKeys.messages(sessionId) });

      const controller = new AbortController();
      setStreamController(sessionId, controller);

      const optimisticUser: ChatMessage = {
        id: 'optimistic-user',
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      const optimisticAi: ChatMessage = {
        id: 'optimistic-ai',
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        streaming: true,
      };

      storeState.setOptimisticMessages(sessionId, [optimisticUser, optimisticAi]);

      try {
        await streamChatMessage({
          sessionId,
          message,
          signal: controller.signal,
          onToken: token => {
            useChatStreamStore
              .getState()
              .updateOptimisticMessage(sessionId, 'optimistic-ai', m => ({
                ...m,
                content: m.content + token,
              }));
          },
          onDone: (_messageId: string) => {
            deleteStreamController(sessionId);
            useChatStreamStore.getState().setStreaming(sessionId, false);
            useChatStreamStore.getState().setOptimisticMessages(sessionId, []);
            queryClient.invalidateQueries({ queryKey: aiChatQueryKeys.messages(sessionId) });
            queryClient.invalidateQueries({ queryKey: aiChatQueryKeys.sessions() });
          },
          onError: errorMessage => {
            deleteStreamController(sessionId);
            useChatStreamStore.getState().clearSession(sessionId);
            toast.error(errorMessage ?? 'AI response failed. Please try again.');
          },
          onSuggestions: suggestions => {
            useChatStreamStore.getState().setSuggestions(sessionId, suggestions);
          },
          onIntent: (intent) => {
            useChatStreamStore.getState().setIntent(sessionId, intent as ChatIntent);
          },
        });
      } catch {
        deleteStreamController(sessionId);
        useChatStreamStore.getState().clearSession(sessionId);
        if (!controller.signal.aborted) {
          toast.error('Connection error. Please try again.');
        }
      }
    },
    [sessionId, queryClient],
  );

  const abort = useCallback(() => {
    getStreamController(sessionId)?.abort();
  }, [sessionId]);

  return {
    send,
    isStreaming: session.isStreaming,
    abort,
    optimisticMessages: session.optimisticMessages,
    suggestions: session.suggestions,
    intent: session.intent,
  };
}
