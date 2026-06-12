import { useCallback, useState } from 'react';
import { ThumbsUp } from 'lucide-react';

import type { DiscussionEntityType } from '@/features/discussion/api/comments-api.types';
import { useCommentLikeToggle } from '@/features/discussion/hooks/use-comment-like-toggle';
import type { CommentLikePatch } from '@/features/discussion/lib/sync-comment-like-query-cache';
import { useDebouncedLike } from '@/shared/hooks/use-debounced-like';
import { cn } from '@/shared/lib/utils';

type CommentLikeButtonProps = {
  commentId: string;
  entityType: DiscussionEntityType;
  entityId: string;
  isLiked: boolean;
  likeCount: number;
  className?: string;
};

export function CommentLikeButton({
  commentId,
  entityType,
  entityId,
  isLiked,
  likeCount,
  className,
}: CommentLikeButtonProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const { mutate } = useCommentLikeToggle(entityType, entityId);

  const onCommit = useCallback(
    (nextState: CommentLikePatch, onSettled: () => void) => {
      setShouldAnimate(nextState.isLiked);
      mutate({ commentId, nextState }, { onSettled });
    },
    [commentId, mutate],
  );

  const { optimistic, toggle } = useDebouncedLike({ isLiked, likeCount, onCommit });

  return (
    <button
      type="button"
      className={cn(
        'text-brand-dark-blue hover:text-brand-dark-blue/80 inline-flex cursor-pointer items-center gap-1.5 text-sm transition-all duration-200 active:scale-90',
        className,
      )}
      aria-label={optimistic.isLiked ? 'Unlike comment' : 'Like comment'}
      aria-pressed={optimistic.isLiked}
      onClick={toggle}
    >
      <ThumbsUp
        className={cn(
          'size-4 transition-colors duration-200',
          optimistic.isLiked
            ? 'fill-brand-dark-blue text-brand-dark-blue'
            : 'text-brand-dark-blue fill-transparent',
          shouldAnimate && 'animate-like-pop',
        )}
      />
      <span aria-live="polite" className="tabular-nums">
        {optimistic.likeCount}
      </span>
    </button>
  );
}
