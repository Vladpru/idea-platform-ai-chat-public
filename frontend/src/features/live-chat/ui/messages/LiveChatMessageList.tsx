import type { LiveChatMessageDto } from '@/features/live-chat/api/live-chat-api.types';
import { LiveChatMessageItem } from '@/features/live-chat/ui/messages/LiveChatMessageItem';
import { useEffect, useRef } from 'react';

import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

function getMessageElementId(messageId: string): string {
  return `live-chat-message-${messageId}`;
}

function smoothScrollContainerToBottom(container: HTMLElement): void {
  container.scrollTo({
    top: container.scrollHeight - container.clientHeight,
    behavior: 'smooth',
  });
}

function smoothScrollContainerToElement(
  container: HTMLElement,
  element: HTMLElement,
): void {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const offsetTop =
    elementRect.top - containerRect.top + container.scrollTop;
  const targetTop = offsetTop + element.offsetHeight - container.clientHeight;

  container.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'smooth',
  });
}

type LiveChatMessageListProps = {
  messages: LiveChatMessageDto[];
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  scrollToMessageId?: string | null;
  onScrolledToMessage?: (messageId: string) => void;
  className?: string;
};

export function LiveChatMessageList({
  messages,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  scrollToMessageId = null,
  onScrolledToMessage,
  className,
}: LiveChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || scrollToMessageId) {
      return;
    }

    if (!shouldStickToBottomRef.current) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      smoothScrollContainerToBottom(container);
    });

    return () => cancelAnimationFrame(frameId);
  }, [messages, scrollToMessageId]);

  useEffect(() => {
    if (!scrollToMessageId) {
      return;
    }

    const messageId = scrollToMessageId;
    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = containerRef.current;
        const target = document.getElementById(getMessageElementId(messageId));

        if (target && container) {
          smoothScrollContainerToElement(container, target);
          shouldStickToBottomRef.current = true;
          onScrolledToMessage?.(messageId);
          return;
        }

        if (container) {
          smoothScrollContainerToBottom(container);
          shouldStickToBottomRef.current = true;
          onScrolledToMessage?.(messageId);
        }
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [messages, onScrolledToMessage, scrollToMessageId]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;
  };

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          'text-brand-gray-500 flex min-h-48 items-center justify-center text-sm',
          className,
        )}
      >
        No messages yet. Start the conversation.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto pr-1 scroll-smooth',
        className,
      )}
    >
      {hasOlder ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
          >
            {isLoadingOlder ? 'Loading...' : 'Load older messages'}
          </Button>
        </div>
      ) : null}

      {messages.map(message => (
        <LiveChatMessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}
