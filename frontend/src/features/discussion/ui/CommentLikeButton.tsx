'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';

import type { DiscussionEntityType } from '@/features/discussion/api/comments-api.types';
import { useCommentLikeToggle } from '@/features/discussion/hooks/use-comment-like-toggle';
import type { CommentLikePatch } from '@/features/discussion/lib/sync-comment-like-query-cache';
import { cn } from '@/shared/lib/utils';

type CommentLikeButtonProps = {
  commentId: string;
  entityType: DiscussionEntityType;
  entityId: string;
  isLiked: boolean;
  likeCount: number;
  className?: string;
};

function getNextLikeState(current: CommentLikePatch): CommentLikePatch {
  return {
    isLiked: !current.isLiked,
    likeCount: current.isLiked
      ? Math.max(0, current.likeCount - 1)
      : current.likeCount + 1,
  };
}

export function CommentLikeButton({
  commentId,
  entityType,
  entityId,
  isLiked,
  likeCount,
  className,
}: CommentLikeButtonProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const { mutate } = useCommentLikeToggle(entityType, entityId);

  return (
    <button
      type="button"
      className={cn(
        'text-brand-dark-blue hover:text-brand-dark-blue/80 inline-flex cursor-pointer items-center gap-1.5 text-sm transition-all duration-200 active:scale-90',
        className,
      )}
      aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
      aria-pressed={isLiked}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();

        if (!hasInteracted) {
          setHasInteracted(true);
        }

        mutate({
          commentId,
          nextState: getNextLikeState({ isLiked, likeCount }),
        });
      }}
    >
      <ThumbsUp
        className={cn(
          'size-4',
          'transition-colors duration-200',
          isLiked
            ? 'text-brand-dark-blue fill-brand-dark-blue'
            : 'text-brand-dark-blue fill-transparent',
          hasInteracted && isLiked && 'animate-like-pop',
        )}
      />
      <span aria-live="polite" className="tabular-nums">
        {likeCount}
      </span>
    </button>
  );
}
