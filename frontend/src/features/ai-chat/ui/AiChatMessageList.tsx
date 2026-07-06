import { useEffect, useRef } from 'react';

import type { ChatMessage } from '../api/ai-chat.types';
import { AiChatMessage } from './AiChatMessage';

export function AiChatMessageList({
  messages,
  isWidget,
}: {
  messages: ChatMessage[];
  isWidget?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-10">
      <div className="flex-1" />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.map(message => (
            <div className="flex w-full flex-col">
              <AiChatMessage
                key={message.id}
                message={message}
                isWidget={isWidget}
              />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
