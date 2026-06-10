import type { LiveChatMessageDto } from '@/features/live-chat/api/live-chat-api.types';
import { formatLiveChatMessageTime } from '@/features/live-chat/lib/format-live-chat-time';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  formatUserDisplayName,
  getAuthorInitials,
} from '@/shared/lib/user-display';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

type LiveChatMessageItemProps = {
  message: LiveChatMessageDto;
};

export function LiveChatMessageItem({ message }: LiveChatMessageItemProps) {
  const currentUserId = useAuthSessionStore(state => state.user?.id);
  const isOwnMessage = currentUserId === message.author.id;
  const authorName = formatUserDisplayName(message.author);

  return (
    <div
      id={`live-chat-message-${message.id}`}
      className={cn(
        'flex min-w-0 gap-3 scroll-mt-4',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={message.author.avatarUrl ?? undefined}
          alt={authorName}
        />
        <AvatarFallback className="bg-slate-200 text-xs font-medium text-slate-800">
          {getAuthorInitials(authorName)}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex min-w-0 max-w-[min(100%,36rem)] flex-col gap-1',
          isOwnMessage ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cn(
            'flex items-baseline gap-2 text-xs',
            isOwnMessage ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span className="text-brand-dark-blue font-medium">{authorName}</span>
          <time
            className="text-brand-gray-500"
            dateTime={message.createdAt}
          >
            {formatLiveChatMessageTime(message.createdAt)}
          </time>
        </div>
        <p
          className={cn(
            'max-w-full rounded-lg px-3 py-2 text-sm [overflow-wrap:anywhere] whitespace-pre-wrap break-words',
            isOwnMessage
              ? 'bg-brand-orange text-white'
              : 'bg-white text-brand-black',
          )}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}
