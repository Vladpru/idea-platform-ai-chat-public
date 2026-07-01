import { useEffect, useRef } from 'react';

import type { ChatMessage } from '../api/ai-chat.types';
import { AiChatMessage } from './AiChatMessage';

export function AiChatMessageList({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1" />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.map(message => (
            <div className="flex w-full flex-col">
              <AiChatMessage key={message.id} message={message} />
              {/* {message.streaming && (
                <span className="text-brand-gray-100 mt-0.5 inline-block animate-pulse">
                  <AiChatThinkingAnimation />
                </span>
              )} */}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
