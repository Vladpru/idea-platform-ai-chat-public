import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { useSessionMessagesQuery } from '../hooks/queries/use-session-messages-query';
import { useNudgeQuery } from '../hooks/queries/use-nudge-query';
import { useChatStream } from '../hooks/use-chat-stream';
import { useChatStreamStore } from '../model/chat-stream-store';
import type { NudgeItem } from '../api/ai-chat.types';
import { AiChatCreateCard } from './AiChatCreateCard';
import { AiChatEmptyState } from './AiChatEmptyState';
import { AiChatInput } from './AiChatInput';
import { AiChatMessageList } from './AiChatMessageList';
import { AiChatSuggestions } from './AiChatSuggestions';

function buildNudgeMessage(items: NudgeItem[]): string {
  const lines = items.map(item => {
    const typeLabel = item.type;
    let reasonLabel: string;
    if (item.reason === 'stale_draft') {
      reasonLabel = 'draft';
    } else {
      reasonLabel = item.stage ? `published, ${item.stage} stage` : 'published';
    }
    return `- "${item.title}" (${typeLabel}, ${reasonLabel}) — not updated for ${item.daysSinceUpdate} days`;
  });

  return [
    'I just opened a new chat. Give me a quick heads-up about these items that need attention:',
    ...lines,
    "Keep it short and friendly, then ask which one I'd like to work on.",
  ].join('\n');
}

type Props = { initialMessage?: string };

export function AiChatSession({ initialMessage }: Props) {
  const { sessionId } = useParams({ from: '/_auth/ai-chat/$sessionId' });
  const navigate = useNavigate();
  const { data: serverMessages = [] } = useSessionMessagesQuery(sessionId);
  const { send, isStreaming, optimisticMessages, suggestions, pendingAction } =
    useChatStream(sessionId);
  const sentRef = useRef(false);
  const nudgeSentRef = useRef(false);

  const { data: nudgeData } = useNudgeQuery(serverMessages.length);

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

  useEffect(() => {
    if (
      nudgeSentRef.current ||
      sentRef.current ||
      isStreaming ||
      serverMessages.length > 0 ||
      !nudgeData ||
      nudgeData.items.length === 0
    ) {
      return;
    }
    nudgeSentRef.current = true;
    send(buildNudgeMessage(nudgeData.items));
  }, [nudgeData, serverMessages.length, isStreaming, send]);

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
