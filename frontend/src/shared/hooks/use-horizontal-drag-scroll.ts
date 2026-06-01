import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';

const DRAG_THRESHOLD_PX = 10;

/** Prevents navigation when the user dragged the horizontal scroll container. */
export function getSuppressClickAfterDragLinkProps(
  suppressClickRef?: RefObject<boolean>,
) {
  return {
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (!suppressClickRef?.current) return;

      event.preventDefault();
      suppressClickRef.current = false;
    },
    onDragStart: (event: DragEvent<HTMLAnchorElement>) => {
      event.preventDefault();
    },
  };
}

type DragState = {
  pointerId: number;
  startX: number;
  scrollLeft: number;
};

/** Pointer-drag to scroll horizontally; exposes a ref to suppress accidental link clicks. */
export function useHorizontalDragScroll(enabled = true) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);

  const onPointerDownCapture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const container = scrollRef.current;
      if (!container) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      didDragRef.current = false;

      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        scrollLeft: container.scrollLeft,
      };
    },
    [enabled],
  );

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    const dragState = dragStateRef.current;
    if (!container || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    if (!didDragRef.current && Math.abs(deltaX) < DRAG_THRESHOLD_PX) {
      return;
    }

    if (!didDragRef.current) {
      didDragRef.current = true;
      setIsDragging(true);
      container.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    container.scrollLeft = dragState.scrollLeft - deltaX;
  }, []);

  const endPointerInteraction = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const container = scrollRef.current;
      const dragState = dragStateRef.current;
      if (!container || !dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }

      dragStateRef.current = null;
      setIsDragging(false);
    },
    [],
  );

  return {
    scrollRef,
    isDragging,
    suppressClickRef: didDragRef,
    dragScrollProps: {
      onPointerDownCapture,
      onPointerMove,
      onPointerUp: endPointerInteraction,
      onPointerCancel: endPointerInteraction,
    },
  };
}
