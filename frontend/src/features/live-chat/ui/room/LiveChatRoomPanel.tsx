import { useLiveChatMessagesQuery } from '@/features/live-chat/hooks/queries/use-live-chat-messages-query';
import { useLiveChatSocket } from '@/features/live-chat/hooks/socket/use-live-chat-socket';
import { LiveChatInput } from '@/features/live-chat/ui/messages/LiveChatInput';
import { LiveChatMessageList } from '@/features/live-chat/ui/messages/LiveChatMessageList';

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

  if (isLoading) {
    return (
      <div className={cn('text-brand-gray-500 py-12 text-center text-sm', className)}>
        Loading chat...
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn('text-brand-orange py-12 text-center text-sm', className)}>
        Could not load chat messages.
      </div>
    );
  }

  return (
    <section
      className={cn(
        'bg-brand-gray-100 flex min-h-[24rem] w-full flex-col rounded-sm p-2',
        className,
      )}
      aria-label="Live chat"
    >
      <LiveChatMessageList
        messages={messages}
        hasOlder={hasOlder}
        isLoadingOlder={isLoadingOlder}
        onLoadOlder={() => void loadOlderMessages()}
        className="max-h-[32rem] flex-1 px-2 sm:px-4"
      />
      <LiveChatInput
        onSend={sendMessage}
        disabled={!isActive}
        className="px-2 sm:px-4"
      />
    </section>
  );
}
