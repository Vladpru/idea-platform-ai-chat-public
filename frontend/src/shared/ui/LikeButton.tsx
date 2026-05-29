'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { useEntityLikeToggle } from '@/shared/hooks/use-entity-like-toggle';
import { ThumbsUp } from 'lucide-react';

export type LikeOptimisticState = {
  isLiked: boolean;
  likeCount: number;
};

export type LikeButtonProps = {
  entityId: string;
  entityType: 'IDEA' | 'PROBLEM';
  isLiked: boolean;
  likeCount: number;
  className?: string;
  iconClassName?: string;
};

const getNextLikeState = (
  currentState: LikeOptimisticState,
): LikeOptimisticState => ({
  isLiked: !currentState.isLiked,
  likeCount: currentState.isLiked
    ? Math.max(0, currentState.likeCount - 1)
    : currentState.likeCount + 1,
});

export function LikeButton({
  entityId,
  entityType,
  isLiked,
  likeCount,
  className,
  iconClassName = 'size-5',
}: LikeButtonProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const { mutate } = useEntityLikeToggle(entityType);

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 transition-all duration-200 active:scale-90',
        'text-brand-dark-blue',
        !isLiked && 'hover:text-brand-dark-blue/80',
        className,
      )}
      aria-label={isLiked ? 'Unlike' : 'Like'}
      aria-pressed={isLiked}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();

        if (!hasInteracted) setHasInteracted(true);

        const nextState = getNextLikeState({ isLiked, likeCount });
        mutate({ id: entityId, nextState });
      }}
    >
      <ThumbsUp
        className={cn(
          iconClassName,
          'transition-colors duration-200',
          isLiked
            ? 'fill-brand-dark-blue text-brand-dark-blue'
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
