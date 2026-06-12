import { useCallback, useEffect, useRef, useState } from 'react';

type LikeState = {
  isLiked: boolean;
  likeCount: number;
};

type Options = {
  isLiked: boolean;
  likeCount: number;
  onCommit: (nextState: LikeState, onSettled: () => void) => void;
  debounceMs?: number;
};

export function useDebouncedLike({
  isLiked,
  likeCount,
  onCommit,
  debounceMs = 600,
}: Options) {
  const optimisticRef = useRef<LikeState>({ isLiked, likeCount });
  const [optimistic, setOptimistic] = useState<LikeState>({ isLiked, likeCount });
  const clickCountRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    if (!isPendingRef.current) {
      const next = { isLiked, likeCount };
      optimisticRef.current = next;
      setOptimistic(next);
    }
  }, [isLiked, likeCount]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const toggle = useCallback(() => {
    const current = optimisticRef.current;
    const next: LikeState = {
      isLiked: !current.isLiked,
      likeCount: current.isLiked
        ? Math.max(0, current.likeCount - 1)
        : current.likeCount + 1,
    };

    optimisticRef.current = next;
    setOptimistic(next);
    clickCountRef.current += 1;
    isPendingRef.current = true;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const clicks = clickCountRef.current;
      clickCountRef.current = 0;
      debounceRef.current = null;

      const onSettled = () => {
        isPendingRef.current = false;
      };

      if (clicks % 2 === 1) {
        onCommit(optimisticRef.current, onSettled);
      } else {
        isPendingRef.current = false;
      }
    }, debounceMs);
  }, [onCommit, debounceMs]);

  return { optimistic, toggle };
}
