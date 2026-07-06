import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePageContext } from '@/shared/model/page-context-store';
import { createSession, fetchSessionMessages } from '../api/ai-chat.api';
import type { ChatMessage } from '../api/ai-chat.types';
import { aiChatQueryKeys } from '../model/ai-chat-query-keys';
import { EMPTY_SESSION, useChatStreamStore } from '../model/chat-stream-store';
import type { PendingFieldAction } from '../model/chat-stream-store';
import { useChatStream } from './use-chat-stream';

const PLACEHOLDER_ID = 'widget-placeholder';

export function useWidgetChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const creatingRef = useRef(false);
  const pageContext = usePageContext();

  const activeId = sessionId ?? PLACEHOLDER_ID;
  const { send: streamSend, isStreaming, suggestions, pendingAction, pendingFieldAction } = useChatStream(activeId);

  const { data: serverMessages = [] } = useQuery({
    queryKey: aiChatQueryKeys.messages(sessionId ?? ''),
    queryFn: () => fetchSessionMessages(sessionId!),
    enabled: !!sessionId,
  });

  const optimisticFromStore = useChatStreamStore(s => (s.sessions[activeId] ?? EMPTY_SESSION).optimisticMessages);
  const messages: ChatMessage[] =
    optimisticFromStore.length > 0
      ? [...serverMessages, ...optimisticFromStore]
      : serverMessages;

  useEffect(() => {
    if (sessionId && pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage(null);
      void streamSend(msg, pageContext ?? undefined);
    }
  }, [sessionId, pendingMessage, streamSend, pageContext]);

  const send = useCallback(async (message: string) => {
    if (creatingRef.current) return;

    if (!sessionId) {
      creatingRef.current = true;
      try {
        const session = await createSession();
        setSessionId(session.id);
        setPendingMessage(message);
      } finally {
        creatingRef.current = false;
      }
      return;
    }

    await streamSend(message, pageContext ?? undefined);
  }, [sessionId, streamSend, pageContext]);

  const clearPendingAction = useCallback(() => {
    useChatStreamStore.getState().setPendingAction(activeId, null);
  }, [activeId]);

  const clearPendingFieldAction = useCallback(() => {
    useChatStreamStore.getState().setPendingFieldAction(activeId, null);
  }, [activeId]);

  return {
    send,
    isStreaming,
    messages,
    suggestions,
    sessionId,
    pendingAction,
    clearPendingAction,
    pendingFieldAction,
    clearPendingFieldAction,
    pageContext,
  };
}
