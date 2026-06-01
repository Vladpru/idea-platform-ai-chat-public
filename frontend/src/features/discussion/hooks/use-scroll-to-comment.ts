import { useCallback } from 'react';
import { toast } from 'sonner';

const DOM_FLUSH_MS = 150;
const HIGHLIGHT_MS = 600;
const MAX_SEARCH_DEPTH = 10;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });
}

function getCommentElement(commentId: string): HTMLElement | null {
  return document.getElementById(`comment-${commentId}`);
}

type FetchNextPageResult = {
  hasNextPage?: boolean;
};

type UseScrollToCommentParams = {
  fetchNextPage: () => Promise<FetchNextPageResult>;
  hasNextPage: boolean;
};

export function useScrollToComment({
  fetchNextPage,
  hasNextPage,
}: UseScrollToCommentParams) {
  const scrollTo = useCallback(
    async (commentId: string) => {
      const toastId = toast.loading('Searching for comment...');

      try {
        let hasMore = hasNextPage;
        let depth = 0;

        while (depth < MAX_SEARCH_DEPTH) {
          const target = getCommentElement(commentId);

          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.setAttribute('data-highlighted', 'true');
            await delay(HIGHLIGHT_MS);
            target.removeAttribute('data-highlighted');
            toast.dismiss(toastId);
            return;
          }

          if (!hasMore) {
            toast.error('Comment could not be found');
            return;
          }

          const result = await fetchNextPage();
          hasMore = Boolean(result.hasNextPage);
          depth++;
          await delay(DOM_FLUSH_MS);
        }

        toast.error('Search limit reached. Comment is too far back.');
      } catch (error) {
        console.error('Error searching for comment:', error);
        toast.error('Network error while searching for comment');
      } finally {
        toast.dismiss(toastId);
      }
    },
    [fetchNextPage, hasNextPage],
  );

  return { scrollTo };
}
