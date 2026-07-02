import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import DOMPurify from 'dompurify';
import { useRef } from 'react';

import { markdownToHtml } from '@/shared/lib/rich-text/markdown-to-html';
import { cn } from '@/shared/lib/utils';

import type { ChatMessage } from '../api/ai-chat.types';
import { NetworkIntelligence } from '../assets/SidebarIcons';
import { AiChatSources } from './AiChatSources';
import { AiChatThinkingAnimation } from './AiChatThinkingAnimation';

export function AiChatMessage({
  message,
  isWidget,
}: {
  message: ChatMessage;
  isWidget?: boolean;
}) {
  const isAdmin = useAuthSessionStore(s => s.user?.role === 'ADMIN');
  const isUser = message.role === 'user';
  const isThinking = message.streaming && !message.content;
  const sources =
    !isUser && isAdmin && message.sources?.length ? message.sources : [];

  const prevLenRef = useRef(0);
  const animKeyRef = useRef(0);

  let settledText = '';
  let delta = '';
  let animKey = animKeyRef.current;
  const finalHtml = !isUser && message.content && !message.streaming
    ? DOMPurify.sanitize(markdownToHtml(message.content))
    : '';

  if (!isUser && message.content && message.streaming) {
    const prev = prevLenRef.current;
    const curr = message.content.length;
    if (curr > prev) {
      delta = message.content.slice(prev);
      animKey = ++animKeyRef.current;
      prevLenRef.current = curr;
    }
    settledText = message.content.slice(0, curr - delta.length);
  }

  if (!message.streaming) {
    prevLenRef.current = 0;
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'items-start justify-start',
      )}
    >
      {!isUser && !isWidget && (
        <div className="bg-brand-dark-blue mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md">
          <NetworkIntelligence className="size-6 text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[72%] leading-relaxed',
          isWidget ? 'text-xs' : 'text-sm',
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
            >
              {message.streaming ? (
                <p className="my-0 whitespace-pre-wrap">
                  {settledText}
                  {delta && (
                    <span
                      key={animKey}
                      style={{
                        display: 'inline',
                        animation: 'token-appear 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      }}
                    >
                      {delta}
                    </span>
                  )}
                </p>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
              )}
            </div>
            {!!sources.length && <AiChatSources sources={sources} />}
          </>
        )}
      </div>
    </div>
  );
}
