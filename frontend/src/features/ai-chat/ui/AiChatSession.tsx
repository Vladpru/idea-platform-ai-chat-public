import { useParams } from '@tanstack/react-router';

import { useSessionMessagesQuery } from '../hooks/queries/use-session-messages-query';
import { useChatStream } from '../hooks/use-chat-stream';
import { AiChatInput } from './AiChatInput';
import { AiChatMessageList } from './AiChatMessageList';

export function AiChatSession() {
  const { sessionId } = useParams({ from: '/_auth/ai-chat/$sessionId' });
  const { data: messages = [] } = useSessionMessagesQuery(sessionId);
  const { send, isStreaming } = useChatStream(sessionId);

  return (
    <div className="flex h-full flex-col">
      <AiChatMessageList messages={messages} />
      <AiChatInput onSend={send} isStreaming={isStreaming} />
    </div>
  );
}
