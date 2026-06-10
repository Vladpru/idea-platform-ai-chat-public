import type { LiveChatMessageDto } from '@/features/live-chat/api/live-chat-api.types';
import { LiveChatMessageItem } from '@/features/live-chat/ui/messages/LiveChatMessageItem';
import { useEffect, useRef } from 'react';

import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

type LiveChatMessageListProps = {
  messages: LiveChatMessageDto[];
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  className?: string;
};

export function LiveChatMessageList({
  messages,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  className,
}: LiveChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldStickToBottomRef.current) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

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
        'flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto pr-1',
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
