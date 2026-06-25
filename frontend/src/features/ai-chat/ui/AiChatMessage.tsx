import { Bot } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import type { ChatMessage } from '../api/ai-chat.types';
import { AiChatSources } from './AiChatSources';

export function AiChatMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const sources = !isUser && message.sources?.length ? message.sources : [];

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'items-start justify-start')}>
      {!isUser && (
        <div className="bg-brand-dark-blue mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md">
          <Bot size={15} className="text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[72%] text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-brand-dark-blue text-white rounded-3xl rounded-br-lg px-4 py-3 shadow-md'
            : 'bg-card text-foreground border border-border rounded-3xl rounded-bl-lg px-4 py-3',
          message.pending && 'opacity-60',
        )}
      >
        {message.content}
        {message.streaming && (
          <span className="text-brand-orange ml-0.5 inline-block animate-pulse">▋</span>
        )}
        {!!sources.length && <AiChatSources sources={sources} />}
      </div>
    </div>
  );
}
