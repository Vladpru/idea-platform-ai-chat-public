import type { CommentParentQuoteDto } from '@/features/discussion/api/comments-api.types';
import { formatCommentTime } from '@/features/discussion/lib/format-discussion-date';
import {
  formatUserDisplayName,
  getAuthorInitials,
} from '@/shared/lib/user-display';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';

type QuotedReplyBlockProps = {
  quote: CommentParentQuoteDto;
  className?: string;
};

export function QuotedReplyBlock({ quote, className }: QuotedReplyBlockProps) {
  const authorName = formatUserDisplayName({
    firstName: quote.author.firstName,
    lastName: quote.author.lastName,
    email: null,
  });

  return (
    <div
      className={cn(
        'border-brand-dark-blue bg-brand-gray-50 mt-3 rounded-r-md border-l-4 p-3',
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

type QuotedReplyPreviewProps = {
  quote: CommentParentQuoteDto;
  onCancel: () => void;
  className?: string;
};

export function QuotedReplyPreview({
  quote,
  onCancel,
  className,
}: QuotedReplyPreviewProps) {
  const authorName = formatUserDisplayName({
    firstName: quote.author.firstName,
    lastName: quote.author.lastName,
    email: null,
  });

  return (
    <div
      className={cn(
        'border-brand-gray-200 bg-brand-neutral mb-2 flex items-start justify-between gap-2 rounded-md border p-3',
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
      <button
        type="button"
        onClick={onCancel}
        className="text-brand-gray-500 hover:text-brand-black shrink-0 cursor-pointer text-xs font-semibold tracking-wide uppercase"
      >
        Cancel
      </button>
    </div>
  );
}
