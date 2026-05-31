import type { CommentParentQuoteDto } from '@/features/discussion/api/comments-api.types';
import { formatCommentTime } from '@/features/discussion/lib/format-discussion-date';
import { formatUserDisplayName } from '@/shared/lib/user-display';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';

type QuotedReplyBlockProps = {
  quote: CommentParentQuoteDto;
  variant?: 'inline' | 'input-preview';
  onCancel?: () => void;
  className?: string;
};

function getAuthorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

export function QuotedReplyBlock({
  quote,
  variant = 'inline',
  onCancel,
  className,
}: QuotedReplyBlockProps) {
  const authorName = formatUserDisplayName({
    firstName: quote.author.firstName,
    lastName: quote.author.lastName,
    email: null,
  });

  const isPreview = variant === 'input-preview';

  if (isPreview) {
    return (
      <div
        className={cn(
          'hover:border-brand-orange border-brand-gray-200 bg-brand-neutral mb-2 flex items-start justify-between gap-2 rounded-md border p-3 transition-all duration-500 ease-in-out',
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-brand-gray-500 mb-1 text-xs font-semibold tracking-wide uppercase">
            Replying to {authorName}
          </p>
          <p className="text-brand-gray-800 line-clamp-2 text-sm whitespace-pre-wrap">
            {quote.content}
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-brand-gray-500 hover:text-brand-black shrink-0 cursor-pointer text-xs font-semibold tracking-wide uppercase"
          >
            Cancel
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-brand-dark-blue bg-brand-gray-50 mt-3 rounded-r-md border-l-4 py-3 pr-3 pl-3',
        className,
      )}
    >
      <div className="flex gap-2">
        <Avatar size="sm" className="shrink-0">
          {quote.author.avatarUrl ? (
            <AvatarImage src={quote.author.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-brand-gray-100 text-brand-gray-700 text-[10px] font-semibold">
            {getAuthorInitials(authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col">
            <span className="text-brand-black text-xs font-semibold">
              {authorName}
            </span>
            <time
              dateTime={quote.createdAt}
              className="text-brand-gray-500 text-[11px] tabular-nums"
            >
              {formatCommentTime(quote.createdAt)}
            </time>
          </div>
          <p className="text-brand-gray-800 mt-2 line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap">
            {quote.content}
          </p>
        </div>
      </div>
    </div>
  );
}
