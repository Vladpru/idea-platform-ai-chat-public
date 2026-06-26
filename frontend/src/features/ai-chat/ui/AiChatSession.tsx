import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';

import { useSessionMessagesQuery } from '../hooks/queries/use-session-messages-query';
import { useChatStream } from '../hooks/use-chat-stream';
import { AiChatEmptyState } from './AiChatEmptyState';
import { AiChatInput } from './AiChatInput';
import { AiChatMessageList } from './AiChatMessageList';

type Props = { initialMessage?: string };

export function AiChatSession({ initialMessage }: Props) {
  const { sessionId } = useParams({ from: '/_auth/ai-chat/$sessionId' });
  const navigate = useNavigate();
  const { data: serverMessages = [] } = useSessionMessagesQuery(sessionId);
  const { send, isStreaming, optimisticMessages } = useChatStream(sessionId);
  const sentRef = useRef(false);

  const messages = optimisticMessages.length > 0 ? [...serverMessages, ...optimisticMessages] : serverMessages;
  const showSuggestions = messages.length === 0 && !isStreaming;

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

  return (
    <div className="flex h-full flex-col">
      {showSuggestions ? (
        <AiChatEmptyState onSuggestion={send} isLoading={isStreaming} />
      ) : (
        <AiChatMessageList messages={messages} />
      )}
      <AiChatInput onSend={send} isStreaming={isStreaming} />
    </div>
  );
}
