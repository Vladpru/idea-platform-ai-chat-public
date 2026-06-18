import type { LiveChatMessageDto } from '@/features/live-chat/api/live-chat-api.types';
import { formatLiveChatMessageTime } from '@/features/live-chat/lib/format-live-chat-time';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  formatUserDisplayName,
  getAuthorInitials,
} from '@/shared/lib/user-display';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { ImageLightbox } from '@/shared/ui/image-lightbox';
import { Loader2, Paperclip } from 'lucide-react';
import { useState } from 'react';

type LiveChatMessageItemProps = {
  message: LiveChatMessageDto;
};

function MessageAttachment({
  url,
  name,
  mimeType,
  isOwn,
  onImageClick,
}: {
  url: string;
  name: string | null;
  mimeType: string | null;
  isOwn: boolean;
  onImageClick: () => void;
}) {
  const displayName = name ?? 'Attachment';

  if (mimeType?.startsWith('image/')) {
    return (
      <button
        type="button"
        onClick={onImageClick}
        className="-mx-1 block w-[calc(100%+0.5rem)] cursor-pointer overflow-hidden rounded-md p-0"
      >
        <img
          src={url}
          alt={displayName}
          className="max-h-60 w-full rounded-md object-cover"
        />
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:underline',
        isOwn
          ? 'border-white/30 text-white hover:border-white/60'
          : 'border-border text-foreground hover:bg-muted/50',
      )}
    >
      <Paperclip className="size-4 shrink-0" aria-hidden />
      <span className="max-w-[220px] truncate">{displayName}</span>
    </a>
  );
}

export function LiveChatMessageItem({ message }: LiveChatMessageItemProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const currentUserId = useAuthSessionStore(state => state.user?.id);
  const isOwnMessage = currentUserId === message.author.id;
  const authorName = formatUserDisplayName(message.author);

  const hasAttachment = Boolean(message.attachmentUrl);
  const isImageAttachment = Boolean(
    message.attachmentMimeType?.startsWith('image/'),
  );

  return (
    <>
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
            {message.pending ? (
              <span className="text-brand-gray-500 flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                Sending…
              </span>
            ) : (
              <time
                className="text-brand-gray-500"
                dateTime={message.createdAt}
              >
                {formatLiveChatMessageTime(message.createdAt)}
              </time>
            )}
          </div>

          <div
            className={cn(
              'flex max-w-full flex-col rounded-lg px-3 py-2 text-sm transition-opacity',
              isOwnMessage
                ? 'bg-brand-orange text-white'
                : 'bg-white text-brand-black',
              message.pending && 'opacity-70',
            )}
          >
            {hasAttachment && message.attachmentUrl && (
              <MessageAttachment
                url={message.attachmentUrl}
                name={message.attachmentName}
                mimeType={message.attachmentMimeType}
                isOwn={isOwnMessage}
                onImageClick={() => setLightboxOpen(true)}
              />
            )}
            {message.content.length > 0 && (
              <p
                className={cn(
                  '[overflow-wrap:anywhere] whitespace-pre-wrap break-words',
                  hasAttachment && 'mt-1',
                )}
              >
                {message.content}
              </p>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && message.attachmentUrl && isImageAttachment && (
        <ImageLightbox
          images={[{ url: message.attachmentUrl, alt: message.attachmentName ?? 'Image' }]}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
