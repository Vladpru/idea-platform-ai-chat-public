import DOMPurify from 'dompurify';

import { cn } from '@/shared/lib/utils';
import { markdownToHtml } from '@/shared/lib/rich-text/markdown-to-html';

import type { ChatMessage } from '../api/ai-chat.types';
import { NetworkIntelligence } from '../assets/SidebarIcons';
import { AiChatSources } from './AiChatSources';
import { AiChatThinkingAnimation } from './AiChatThinkingAnimation';

export function AiChatMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isCannotAnswer = !isUser && /cannot answer (this|your) question/i.test(message.content ?? '');
  const sources = !isUser && !isCannotAnswer && message.sources?.length ? message.sources : [];
  const isThinking = message.streaming && !message.content;

  const aiHtml = !isUser && message.content
    ? DOMPurify.sanitize(markdownToHtml(message.content))
    : '';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'items-start justify-start',
      )}
    >
      {!isUser && (
        <div className="bg-brand-dark-blue mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md">
          <NetworkIntelligence className="size-6 text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[72%] text-sm leading-relaxed',
          isUser
            ? 'bg-brand-dark-blue rounded-3xl rounded-br-lg px-4 py-3 text-white shadow-md'
            : 'bg-card text-foreground border-border rounded-3xl rounded-bl-lg border px-4 py-3',
          message.pending && 'opacity-60',
          isThinking && 'px-3 py-2',
        )}
      >
        {isThinking ? (
          <AiChatThinkingAnimation />
        ) : isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <>
            <div
              className={cn(
                'prose prose-sm dark:prose-invert max-w-none',
                'prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-pre:my-2',
                '*:first:mt-0 *:last:mb-0',
                'prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-xs',
                'prose-pre:bg-muted prose-pre:text-xs',
              )}
              dangerouslySetInnerHTML={{ __html: aiHtml }}
            />
            {message.streaming && (
              <span className="text-brand-orange mt-0.5 inline-block animate-pulse">▋</span>
            )}
            {!!sources.length && <AiChatSources sources={sources} />}
          </>
        )}
      </div>
    </div>
  );
}
