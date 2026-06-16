import type { LiveChatAttachmentPayload } from '@/features/live-chat/api/live-chat-api.types';
import { useLiveChatMessagesQuery } from '@/features/live-chat/hooks/queries/use-live-chat-messages-query';
import { useLiveChatSocket } from '@/features/live-chat/hooks/socket/use-live-chat-socket';
import { LiveChatInput } from '@/features/live-chat/ui/messages/LiveChatInput';
import { LiveChatMessageList } from '@/features/live-chat/ui/messages/LiveChatMessageList';
import { useCallback, useState } from 'react';

import { cn } from '@/shared/lib/utils';

type LiveChatRoomPanelProps = {
  roomId: string;
  enabled?: boolean;
  className?: string;
};

export function LiveChatRoomPanel({
  roomId,
  enabled = true,
  className,
}: LiveChatRoomPanelProps) {
  const isActive = enabled && Boolean(roomId);

  const {
    messages,
    hasOlder,
    isLoading,
    isError,
    loadOlderMessages,
    isLoadingOlder,
  } = useLiveChatMessagesQuery(roomId, { enabled: isActive });

  const { sendMessage } = useLiveChatSocket(roomId, isActive);
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(
    null,
  );

  const handleSend = useCallback(
    async (content: string, attachment?: LiveChatAttachmentPayload | null) => {
      const message = await sendMessage(content, attachment);
      if (message) {
        setScrollToMessageId(message.id);
        return true;
      }
      return false;
    },
    [sendMessage],
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          'text-brand-gray-500 py-12 text-center text-sm',
          className,
        )}
      >
        Loading chat...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn('text-brand-orange py-12 text-center text-sm', className)}
      >
        Could not load chat messages.
      </div>
    );
  }

  return (
    <section
      className={cn(
        'flex min-h-0 w-full flex-col bg-zinc-50 p-4 dark:bg-zinc-900',
        className,
      )}
      aria-label="Live chat"
    >
      <LiveChatMessageList
        messages={messages}
        hasOlder={hasOlder}
        isLoadingOlder={isLoadingOlder}
        onLoadOlder={() => void loadOlderMessages()}
        scrollToMessageId={scrollToMessageId}
        onScrolledToMessage={() => setScrollToMessageId(null)}
        className="min-h-0 flex-1"
      />
      <LiveChatInput
        roomId={roomId}
        onSend={handleSend}
        disabled={!isActive}
        className="mt-4 shrink-0 px-2 sm:px-4"
        isDuringCall
      />
    </section>
  );
}
