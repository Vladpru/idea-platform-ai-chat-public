import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { useSessionMessagesQuery } from '../hooks/queries/use-session-messages-query';
import { useChatStream } from '../hooks/use-chat-stream';
import { useChatStreamStore } from '../model/chat-stream-store';
import { AiChatCreateCard } from './AiChatCreateCard';
import { AiChatEmptyState } from './AiChatEmptyState';
import { AiChatInput } from './AiChatInput';
import { AiChatMessageList } from './AiChatMessageList';
import { AiChatSuggestions } from './AiChatSuggestions';

type Props = { initialMessage?: string };

export function AiChatSession({ initialMessage }: Props) {
  const { sessionId } = useParams({ from: '/_auth/ai-chat/$sessionId' });
  const navigate = useNavigate();
  const { data: serverMessages = [] } = useSessionMessagesQuery(sessionId);
  const { send, isStreaming, optimisticMessages, suggestions, pendingAction } =
    useChatStream(sessionId);
  const sentRef = useRef(false);

  const messages =
    optimisticMessages.length > 0
      ? [...serverMessages, ...optimisticMessages]
      : serverMessages;
  const everHadMessages = useRef(false);
  const showEmptyState = messages.length === 0 && !isStreaming;

  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      everHadMessages.current = true;
    }
  }, [messages.length, isStreaming]);

  useEffect(() => {
    if (initialMessage && !sentRef.current) {
      sentRef.current = true;
      send(initialMessage);
      navigate({
        to: '/ai-chat/$sessionId',
        params: { sessionId },
        search: {},
        replace: true,
      });
    }
  }, [initialMessage, sessionId, send, navigate]);

  function handleDismissAction() {
    useChatStreamStore.getState().setPendingAction(sessionId, null);
  }

  return (
    <div className="flex h-full flex-col">
      {showEmptyState ? (
        <AiChatEmptyState onSuggestion={send} isLoading={isStreaming} />
      ) : (
        <AiChatMessageList messages={messages} />
      )}
      {!isStreaming && pendingAction && (
        <div className="mb-18">
          <AiChatCreateCard
            action={pendingAction}
            onDismiss={handleDismissAction}
          />
        </div>
      )}
      <div className="relative shrink-0">
        {!isStreaming && suggestions.length > 0 && (
          <div className="absolute right-0 bottom-full left-0 mx-auto w-full max-w-3xl px-4 pb-2 sm:px-6">
            <AiChatSuggestions suggestions={suggestions} onSelect={send} />
          </div>
        )}
        <AiChatInput onSend={send} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
