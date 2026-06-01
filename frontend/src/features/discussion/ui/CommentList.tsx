'use client';

import { useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';

import type {
  CommentDto,
  DiscussionEntityType,
} from '@/features/discussion/api/comments-api.types';
import { buildCommentListItems } from '@/features/discussion/lib/build-comment-list-items';
import { CommentDateSeparator } from '@/features/discussion/ui/CommentDateSeparator';
import { CommentItem } from '@/features/discussion/ui/CommentItem';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

type CommentListProps = {
  comments: CommentDto[];
  entityType: DiscussionEntityType;
  entityId: string;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onRetry?: () => void;
  onQuoteClick?: (commentId: string) => void;
  className?: string;
};

function CommentListSkeleton() {
  return (
    <div className="space-y-4 py-2" aria-busy aria-label="Loading comments">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="mt-3 h-12 w-full" />
          <div className="mt-4 flex justify-end gap-6">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommentList({
  comments,
  entityType,
  entityId,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRetry,
  onQuoteClick,
  className,
}: CommentListProps) {
  const listItems = useMemo(() => buildCommentListItems(comments), [comments]);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className={cn(className)}>
        <CommentListSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn(className)}>
        <div className="py-12 text-center">
          <p className="text-brand-gray-600 mb-3 text-sm">
            Could not load comments.
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-brand-dark-blue text-sm font-semibold tracking-wide uppercase hover:underline"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={cn(className)}>
        <p className="text-brand-gray-600 py-12 text-center text-sm">
          No comments yet. Start the discussion.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <ul className="list-none">
        {listItems.map(item => {
          if (item.type === 'date') {
            return (
              <li key={item.key}>
                <CommentDateSeparator label={item.label} />
              </li>
            );
          }

          return (
            <li key={item.key}>
              <CommentItem
                comment={item.comment}
                entityType={entityType}
                entityId={entityId}
                onQuoteClick={onQuoteClick}
              />
            </li>
          );
        })}
      </ul>

      <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />

      {isFetchingNextPage ? (
        <p className="text-brand-gray-500 py-2 text-center text-xs">
          Loading more…
        </p>
      ) : null}
    </div>
  );
}
