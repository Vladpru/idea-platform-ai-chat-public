'use client';

import type {
  CommentSort,
  DiscussionEntityType,
} from '@/features/discussion/api/comments-api.types';
import { useCommentsInfiniteQuery } from '@/features/discussion/hooks/use-comments-infinite-query';
import { useScrollToComment } from '@/features/discussion/hooks/use-scroll-to-comment';
import { useDiscussionUiStore } from '@/features/discussion/model/discussion-ui-store';
import { CommentInputArea } from '@/features/discussion/ui/CommentInputArea';
import { CommentList } from '@/features/discussion/ui/CommentList';
import { ReplyFromSearchEffect } from '@/features/discussion/ui/ReplyFromSearchEffect';
import { ReplyProvider } from '@/features/discussion/ui/ReplyProvider';
import { Route as IdeaDetailsRoute } from '@/routes/_auth/ideas/$ideaId';
import { Route as ProblemDetailsRoute } from '@/routes/_auth/problems/$problemId';
import { useCallback, useMemo } from 'react';

import { DashboardControls } from '@/shared/dashboard';
import { cn } from '@/shared/lib/utils';

const COMMENT_SORT_OPTIONS: { label: string; value: CommentSort }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
];

type DiscussionTabProps = {
  entityType: DiscussionEntityType;
  entityId: string;
  enabled?: boolean;
  className?: string;
  replyToCommentId?: string;
  onReplyToConsumed?: () => void;
};

type DiscussionTabLayoutProps = DiscussionTabProps & {
  sort: CommentSort;
  onSortChange: (sort: CommentSort) => void;
};

function useIdeaDiscussionCommentSort() {
  const search = IdeaDetailsRoute.useSearch();
  const navigate = IdeaDetailsRoute.useNavigate();
  const sort: CommentSort = search.sort === 'oldest' ? 'oldest' : 'newest';

  const onSortChange = useCallback(
    (nextSort: CommentSort) => {
      void navigate({
        search: prev => ({ ...prev, sort: nextSort }),
        replace: true,
      });
    },
    [navigate],
  );

  return { sort, onSortChange };
}

function useProblemDiscussionCommentSort() {
  const search = ProblemDetailsRoute.useSearch();
  const navigate = ProblemDetailsRoute.useNavigate();
  const sort: CommentSort = search.sort === 'oldest' ? 'oldest' : 'newest';

  const onSortChange = useCallback(
    (nextSort: CommentSort) => {
      void navigate({
        search: prev => ({ ...prev, sort: nextSort }),
        replace: true,
      });
    },
    [navigate],
  );

  return { sort, onSortChange };
}

function DiscussionTabLayout({
  entityType,
  entityId,
  enabled = true,
  className,
  sort,
  onSortChange,
  replyToCommentId,
  onReplyToConsumed,
}: DiscussionTabLayoutProps & {
  replyToCommentId?: string;
  onReplyToConsumed?: () => void;
}) {
  const draftClearToken = useDiscussionUiStore(s => s.draftClearToken);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useCommentsInfiniteQuery(entityType, entityId, { enabled, sort });

  const { scrollTo: scrollToComment } = useScrollToComment({
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
  });

  const handleQuoteClick = useCallback(
    (commentId: string) => {
      void scrollToComment(commentId);
    },
    [scrollToComment],
  );

  const comments = useMemo(
    () => data?.pages.flatMap(page => page.data) ?? [],
    [data],
  );

  const handleLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return (
    <section
      className={cn('bg-brand-gray-100 w-full rounded-sm p-2', className)}
      aria-label="Discussion"
    >
      <ReplyFromSearchEffect
        replyToCommentId={replyToCommentId}
        enabled={enabled}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        comments={comments}
        hasNextPage={hasNextPage ?? false}
        fetchNextPage={fetchNextPage}
        onConsumed={() => onReplyToConsumed?.()}
      />
      <div className="flex items-center justify-between px-2 sm:px-4">
        <h2 className="text-brand-gray-600 text-sm font-semibold">Sort by:</h2>
        <DashboardControls
          sort={sort}
          onSortChange={onSortChange}
          sortOptions={COMMENT_SORT_OPTIONS}
          sortLabel="Sort comments"
          sortSelectId="comment-sort"
          className="mb-2 justify-end"
        />
      </div>
      <CommentList
        comments={comments}
        entityType={entityType}
        entityId={entityId}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleLoadMore}
        onRetry={() => {
          void refetch();
        }}
        onQuoteClick={handleQuoteClick}
      />
      <CommentInputArea
        key={`comment-input-${draftClearToken}`}
        entityType={entityType}
        entityId={entityId}
      />
    </section>
  );
}

function IdeaDiscussionTabContent({
  entityId,
  enabled,
  className,
  replyToCommentId,
  onReplyToConsumed,
}: Omit<DiscussionTabProps, 'entityType'>) {
  const { sort, onSortChange } = useIdeaDiscussionCommentSort();

  return (
    <DiscussionTabLayout
      entityType="IDEA"
      entityId={entityId}
      enabled={enabled}
      className={className}
      sort={sort}
      onSortChange={onSortChange}
      replyToCommentId={replyToCommentId}
      onReplyToConsumed={onReplyToConsumed}
    />
  );
}

function ProblemDiscussionTabContent({
  entityId,
  enabled,
  className,
  replyToCommentId,
  onReplyToConsumed,
}: Omit<DiscussionTabProps, 'entityType'>) {
  const { sort, onSortChange } = useProblemDiscussionCommentSort();

  return (
    <DiscussionTabLayout
      entityType="PROBLEM"
      entityId={entityId}
      enabled={enabled}
      className={className}
      sort={sort}
      onSortChange={onSortChange}
      replyToCommentId={replyToCommentId}
      onReplyToConsumed={onReplyToConsumed}
    />
  );
}

export function DiscussionTab({
  entityType,
  entityId,
  enabled = true,
  className,
  replyToCommentId,
  onReplyToConsumed,
}: DiscussionTabProps) {
  return (
    <ReplyProvider>
      {entityType === 'IDEA' ? (
        <IdeaDiscussionTabContent
          entityId={entityId}
          enabled={enabled}
          className={className}
          replyToCommentId={replyToCommentId}
          onReplyToConsumed={onReplyToConsumed}
        />
      ) : (
        <ProblemDiscussionTabContent
          entityId={entityId}
          enabled={enabled}
          className={className}
          replyToCommentId={replyToCommentId}
          onReplyToConsumed={onReplyToConsumed}
        />
      )}
    </ReplyProvider>
  );
}
