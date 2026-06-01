import { useDiscussionUiStore } from '@/features/discussion/model/discussion-ui-store';

const HIGHLIGHT_DURATION_MS = 600;
const RETRY_DELAYS_MS = [0, 16, 50, 100, 200, 400];

function applyHighlight(element: HTMLElement) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.setAttribute('data-highlighted', 'true');
  window.setTimeout(() => {
    element.removeAttribute('data-highlighted');
  }, HIGHLIGHT_DURATION_MS);
}

/** Scroll to and highlight the comment currently being edited. Returns true if found. */
export function highlightDirtyComment(): boolean {
  const editingCommentId = useDiscussionUiStore.getState().editingCommentId;
  if (!editingCommentId) {
    return false;
  }

  const element = document.getElementById(`comment-${editingCommentId}`);
  if (!element) {
    return false;
  }

  applyHighlight(element);
  return true;
}

/**
 * Attempts highlight immediately, then on rAF and short delays for late DOM updates.
 * Calls `onComplete` once highlight succeeds or after the final retry.
 */
export function scheduleHighlightDirtyComment(onComplete?: () => void): () => void {
  let cancelled = false;
  const timeoutIds: number[] = [];

  const clearScheduled = () => {
    cancelled = true;
    timeoutIds.forEach(id => window.clearTimeout(id));
    timeoutIds.length = 0;
  };

  const attempt = (isLast: boolean) => {
    if (cancelled) {
      return;
    }
    if (highlightDirtyComment()) {
      onComplete?.();
      clearScheduled();
      return;
    }
    if (isLast) {
      onComplete?.();
      clearScheduled();
    }
  };

  attempt(false);

  const rafId = requestAnimationFrame(() => {
    if (cancelled) {
      return;
    }
    attempt(false);

    RETRY_DELAYS_MS.forEach((delay, index) => {
      const isLast = index === RETRY_DELAYS_MS.length - 1;
      const id = window.setTimeout(() => attempt(isLast), delay);
      timeoutIds.push(id);
    });
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    timeoutIds.forEach(id => window.clearTimeout(id));
  };
}
