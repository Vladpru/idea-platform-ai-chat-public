import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { streamChatMessage } from '../api/ai-chat.stream';
import type { ChatMessage } from '../api/ai-chat.types';
import { aiChatQueryKeys } from '../model/ai-chat-query-keys';

export function useChatStream(sessionId: string) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [sessionId]);

  const send = useCallback(
    async (message: string) => {
      if (isStreamingRef.current) return;
      isStreamingRef.current = true;
      setIsStreaming(true);

      await queryClient.cancelQueries({ queryKey: aiChatQueryKeys.messages(sessionId) });

      const controller = new AbortController();
      abortRef.current = controller;

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

      setOptimisticMessages([optimisticUser, optimisticAi]);

      try {
        await streamChatMessage({
          sessionId,
          message,
          signal: controller.signal,
          onToken: token => {
            setOptimisticMessages(prev =>
              prev.map(m =>
                m.id === 'optimistic-ai' ? { ...m, content: m.content + token } : m,
              ),
            );
          },
          onDone: (_messageId: string) => {
            setOptimisticMessages([]);
            queryClient.invalidateQueries({
              queryKey: aiChatQueryKeys.messages(sessionId),
            });
            queryClient.invalidateQueries({
              queryKey: aiChatQueryKeys.sessions(),
            });
          },
          onError: errorMessage => {
            setOptimisticMessages([]);
            toast.error(errorMessage ?? 'AI response failed. Please try again.');
          },
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setOptimisticMessages([]);
          toast.error('Connection error. Please try again.');
        }
      } finally {
        isStreamingRef.current = false;
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [sessionId, queryClient],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, isStreaming, abort, optimisticMessages };
}
