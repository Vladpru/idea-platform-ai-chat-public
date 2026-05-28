'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
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
  initialIsLiked: boolean;
  initialLikeCount: number;
  onSuccess?: (nextState: LikeOptimisticState) => void;
  onLikeToggle?: (id: string, nextState: LikeOptimisticState) => Promise<void>;
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
  initialIsLiked,
  initialLikeCount,
  onSuccess,
  onLikeToggle,
  className,
  iconClassName = 'size-5',
}: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [hasInteracted, setHasInteracted] = useState(false);

  const { mutateAsync: defaultMutateAsync } = useEntityLikeToggle(entityType);

  const toggleLike =
    onLikeToggle ??
    (async (id, nextState) => {
      await defaultMutateAsync({ id, nextState });
    });

  const [optimisticState, addOptimisticToggle] = useOptimistic<
    LikeOptimisticState,
    void
  >({ isLiked: initialIsLiked, likeCount: initialLikeCount }, currentState =>
    getNextLikeState(currentState),
  );

  const ariaLabel = optimisticState.isLiked ? 'Unlike' : 'Like';

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 transition-all duration-200 active:scale-90 disabled:pointer-events-none disabled:opacity-50',
        'text-brand-dark-blue',
        !optimisticState.isLiked && 'hover:text-brand-dark-blue/80',
        className,
      )}
      aria-label={ariaLabel}
      aria-pressed={optimisticState.isLiked}
      disabled={isPending}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();

        if (!hasInteracted) {
          setHasInteracted(true);
        }

        const nextState = getNextLikeState(optimisticState);

        startTransition(async () => {
          addOptimisticToggle();
          try {
            await toggleLike(entityId, nextState);
            onSuccess?.(nextState);
          } catch (err) {
            console.error(err);
            toast.error('Could not update like');
          }
        });
      }}
    >
      <ThumbsUp
        className={cn(
          iconClassName,
          'transition-colors duration-200',
          optimisticState.isLiked
            ? 'fill-brand-dark-blue text-brand-dark-blue'
            : 'text-brand-dark-blue fill-transparent',
          hasInteracted && optimisticState.isLiked && 'animate-like-pop',
        )}
      />
      <span aria-live="polite" className="tabular-nums">
        {optimisticState.likeCount}
      </span>
    </button>
  );
}
