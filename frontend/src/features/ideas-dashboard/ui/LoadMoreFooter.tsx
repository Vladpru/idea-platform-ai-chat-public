import { Loader2 } from 'lucide-react';
import { memo } from 'react';

type LoadMoreFooterProps = {
  isFetchingNextPage: boolean;
  loadingMessage: string;
};

function LoadMoreFooterInner({
  isFetchingNextPage,
  loadingMessage,
}: LoadMoreFooterProps) {
  if (!isFetchingNextPage) {
    return null;
  }

  return (
    <div className="text-brand-gray-600 flex items-center justify-center gap-2 py-8 text-sm">
      <Loader2
        className="text-brand-dark-blue size-4 animate-spin"
        aria-hidden
      />
      <span>{loadingMessage}</span>
    </div>
  );
}

function areLoadMoreFooterPropsEqual(
  prev: LoadMoreFooterProps,
  next: LoadMoreFooterProps,
): boolean {
  return (
    prev.isFetchingNextPage === next.isFetchingNextPage &&
    prev.loadingMessage === next.loadingMessage
  );
}

export const LoadMoreFooter = memo(
  LoadMoreFooterInner,
  areLoadMoreFooterPropsEqual,
);
