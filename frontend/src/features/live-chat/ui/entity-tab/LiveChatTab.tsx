import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';
import { useCreateLiveChatRoomMutation } from '@/features/live-chat/hooks/mutations/use-create-live-chat-room-mutation';
import { useLiveChatRoomByEntityQuery } from '@/features/live-chat/hooks/queries/use-live-chat-room-by-entity-query';
import { LiveChatRoomPanel } from '@/features/live-chat/ui/room/LiveChatRoomPanel';
import { isApiNotFoundError } from '@/shared/api/api-error';

import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

type LiveChatTabProps = {
  entityType: LiveChatEntityType;
  entityId: string;
  enabled?: boolean;
  className?: string;
};

export function LiveChatTab({
  entityType,
  entityId,
  enabled = true,
  className,
}: LiveChatTabProps) {
  const createRoomMutation = useCreateLiveChatRoomMutation();
  const {
    data: room,
    isLoading,
    isError,
    error,
  } = useLiveChatRoomByEntityQuery(entityType, entityId, { enabled });

  const roomNotFound = isError && isApiNotFoundError(error);

  if (isLoading) {
    return (
      <div className={cn('text-brand-gray-500 py-12 text-center text-sm', className)}>
        Loading live chat...
      </div>
    );
  }

  if (roomNotFound) {
    return (
      <div
        className={cn(
          'border-brand-gray-200 flex min-h-48 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center',
          className,
        )}
      >
        <p className="text-brand-gray-600 text-sm">
          No live chat exists for this {entityType === 'ideas' ? 'idea' : 'problem'}{' '}
          yet.
        </p>
        <Button
          type="button"
          className="bg-brand-orange hover:bg-brand-orange/90"
          disabled={createRoomMutation.isPending}
          onClick={() =>
            void createRoomMutation.mutateAsync({ entityType, entityId })
          }
        >
          Start live chat
        </Button>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className={cn('text-brand-orange py-12 text-center text-sm', className)}>
        Could not load live chat.
      </div>
    );
  }

  return (
    <LiveChatRoomPanel
      roomId={room.id}
      enabled={enabled}
      className={className}
    />
  );
}
