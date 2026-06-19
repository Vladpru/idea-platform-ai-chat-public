import { usePostHog } from '@posthog/react';
import { ThumbsUp } from 'lucide-react';
import { useCallback, useState } from 'react';

import { useDebouncedLike } from '@/shared/hooks/use-debounced-like';
import { useEntityLikeToggle } from '@/shared/hooks/use-entity-like-toggle';
import { cn } from '@/shared/lib/utils';

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
  const posthog = usePostHog();

  const onCommit = useCallback(
    (nextState: LikeOptimisticState, onSettled: () => void) => {
      mutate({ id: entityId, nextState }, { onSettled });
    },
    [entityId, mutate],
  );

  const { optimistic, toggle } = useDebouncedLike({
    isLiked,
    likeCount,
    onCommit,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasInteracted) setHasInteracted(true);
    if (!optimistic.isLiked) {
      posthog.capture('entity_liked', { entity_id: entityId, entity_type: entityType });
    }
    toggle();
  };

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 transition-all duration-200 active:scale-90',
        'text-brand-dark-blue',
        !optimistic.isLiked && 'hover:text-brand-dark-blue/80',
        className,
      )}
      aria-label={optimistic.isLiked ? 'Unlike' : 'Like'}
      aria-pressed={optimistic.isLiked}
      onClick={handleClick}
    >
      <ThumbsUp
        className={cn(
          iconClassName,
          'transition-colors duration-200',
          optimistic.isLiked
            ? 'fill-brand-dark-blue text-brand-dark-blue'
            : 'text-brand-dark-blue fill-transparent',
          hasInteracted && optimistic.isLiked && 'animate-like-pop',
        )}
      />
      <span aria-live="polite" className="tabular-nums">
        {optimistic.likeCount}
      </span>
    </button>
  );
}
