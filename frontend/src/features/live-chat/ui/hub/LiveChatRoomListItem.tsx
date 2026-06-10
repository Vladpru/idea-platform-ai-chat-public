import type { LiveChatRoomDto } from '@/features/live-chat/api/live-chat-api.types';
import {
  formatLiveChatMessageTime,
  formatLiveChatRoomUpdatedAt,
} from '@/features/live-chat/lib/format-live-chat-time';
import { liveChatEntityLabel } from '@/features/live-chat/lib/live-chat-entity-type';
import { Link } from '@tanstack/react-router';

import { cn } from '@/shared/lib/utils';

type LiveChatRoomListItemProps = {
  room: LiveChatRoomDto;
  className?: string;
};

export function LiveChatRoomListItem({
  room,
  className,
}: LiveChatRoomListItemProps) {
  const preview = room.lastMessage?.content ?? 'No messages yet';

  return (
    <Link
      to="/live-chats/$roomId"
      params={{ roomId: room.id }}
      className={cn(
        'border-brand-gray-200 hover:border-brand-orange/40 block rounded-lg border p-4 transition-colors',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="bg-brand-light-blue text-brand-dark-blue rounded px-2 py-0.5 text-xs font-medium uppercase">
              {liveChatEntityLabel(room.entity.type)}
            </span>
            <h2 className="text-brand-dark-blue truncate text-base font-semibold">
              {room.entity.title ?? 'Untitled'}
            </h2>
          </div>
          <p className="text-brand-gray-600 line-clamp-2 text-sm [overflow-wrap:anywhere] break-words">
            {preview}
          </p>
        </div>
        <time
          className="text-brand-gray-500 shrink-0 text-xs"
          dateTime={room.lastMessage?.createdAt ?? room.updatedAt}
        >
          {room.lastMessage
            ? formatLiveChatMessageTime(room.lastMessage.createdAt)
            : formatLiveChatRoomUpdatedAt(room.updatedAt)}
        </time>
      </div>
    </Link>
  );
}
