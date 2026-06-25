import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { streamChatMessage } from '../api/ai-chat.stream';
import type { ChatMessage } from '../api/ai-chat.types';
import { aiChatQueryKeys } from '../model/ai-chat-query-keys';

export function useChatStream(sessionId: string) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [sessionId]);

  const send = useCallback(
    async (message: string) => {
      if (isStreaming) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

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

      queryClient.setQueryData(
        aiChatQueryKeys.messages(sessionId),
        (prev: ChatMessage[] = []) => [...prev, optimisticUser, optimisticAi],
      );

      const rollback = () => {
        queryClient.setQueryData(
          aiChatQueryKeys.messages(sessionId),
          (prev: ChatMessage[] = []) =>
            prev.filter(m => m.id !== 'optimistic-user' && m.id !== 'optimistic-ai'),
        );
      };

      try {
        await streamChatMessage({
          sessionId,
          message,
          signal: controller.signal,
          onToken: token => {
            queryClient.setQueryData(
              aiChatQueryKeys.messages(sessionId),
              (prev: ChatMessage[] = []) =>
                prev.map(m =>
                  m.id === 'optimistic-ai'
                    ? { ...m, content: m.content + token }
                    : m,
                ),
            );
          },
          onDone: () => {
            rollback();
            queryClient.invalidateQueries({
              queryKey: aiChatQueryKeys.messages(sessionId),
            });
            queryClient.invalidateQueries({
              queryKey: aiChatQueryKeys.sessions(),
            });
          },
          onError: errorMessage => {
            rollback();
            toast.error(errorMessage ?? 'AI response failed. Please try again.');
          },
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          rollback();
          toast.error('Connection error. Please try again.');
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [sessionId, isStreaming, queryClient],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, isStreaming, abort };
}
