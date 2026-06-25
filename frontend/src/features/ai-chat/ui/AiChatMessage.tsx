import { Bot } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import type { ChatMessage } from '../api/ai-chat.types';

export function AiChatMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="bg-brand-dark-blue mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-brand-dark-blue text-white opacity-100'
            : 'bg-muted text-foreground',
          message.pending && 'opacity-60',
        )}
      >
        {message.content}
        {message.streaming && (
          <span className="text-brand-orange ml-0.5 animate-pulse">▋</span>
        )}
      </div>
    </div>
  );
}
