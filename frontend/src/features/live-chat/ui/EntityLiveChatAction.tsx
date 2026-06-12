import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';
import { useCreateLiveChatRoomMutation } from '@/features/live-chat/hooks/mutations/use-create-live-chat-room-mutation';
import { useLiveChatRoomByEntityQuery } from '@/features/live-chat/hooks/queries/use-live-chat-room-by-entity-query';
import {
  type DiscussionEntityKind,
  toLiveChatEntityType,
} from '@/features/live-chat/lib/live-chat-entity-type';
import { outlineBtnClass } from '@/features/ideas/lib/styles';
import { useNavigate } from '@tanstack/react-router';

import { isApiNotFoundError } from '@/shared/api/api-error';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type EntityViewer = {
  isAuthor: boolean;
  isMember: boolean;
};

type EntityLiveChatActionProps = {
  entityKind: DiscussionEntityKind;
  entityId: string;
  viewer: EntityViewer;
  className?: string;
  layout?: 'inline' | 'stacked';
};

const chatBtnClass =
  'border-brand-dark-blue text-brand-dark-blue hover:bg-brand-dark-blue/10 h-10 rounded-sm border bg-card px-2 font-bold uppercase tracking-wide min-w-0 sm:px-5';

export function EntityLiveChatAction({
  entityKind,
  entityId,
  viewer,
  className,
  layout = 'inline',
}: EntityLiveChatActionProps) {
  const navigate = useNavigate();
  const entityType: LiveChatEntityType = toLiveChatEntityType(entityKind);
  const canAccessChat =
    entityKind === 'PROBLEM' || viewer.isAuthor || viewer.isMember;

  const createRoomMutation = useCreateLiveChatRoomMutation();
  const {
    data: room,
    isLoading,
    isError,
    error,
  } = useLiveChatRoomByEntityQuery(entityType, entityId, {
    enabled: canAccessChat,
  });

  if (!canAccessChat) {
    return null;
  }

  const roomNotFound = isError && isApiNotFoundError(error);
  const hasRoom = Boolean(room);
  const isBusy = isLoading || createRoomMutation.isPending;

  const navigateToRoom = (roomId: string) => {
    void navigate({
      to: '/live-chats/$roomId',
      params: { roomId },
    });
  };

  const handleClick = () => {
    if (hasRoom && room) {
      navigateToRoom(room.id);
      return;
    }

    if (roomNotFound) {
      createRoomMutation.mutate(
        { entityType, entityId },
        { onSuccess: created => navigateToRoom(created.id) },
      );
    }
  };

  const label = hasRoom ? 'GO TO LIVE CHAT' : 'START LIVE CHAT';
  const canStartOrOpen = hasRoom || roomNotFound;

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        outlineBtnClass,
        chatBtnClass,
        layout === 'stacked' && 'w-full',
        className,
      )}
      disabled={isBusy || (!canStartOrOpen && isError)}
      isLoading={isBusy}
      onClick={handleClick}
    >
      <span className="truncate text-[12px] sm:text-sm">{label}</span>
    </Button>
  );
}
