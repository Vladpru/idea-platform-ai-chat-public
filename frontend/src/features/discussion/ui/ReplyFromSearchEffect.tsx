'use client';

import { useEffect, useRef } from 'react';

import type { CommentDto } from '@/features/discussion/api/comments-api.types';
import { useScrollToComment } from '@/features/discussion/hooks/use-scroll-to-comment';
import { useReplyContext } from '@/features/discussion/ui/reply-context';

type ReplyFromSearchEffectProps = {
  replyToCommentId?: string;
  enabled: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  comments: CommentDto[];
  hasNextPage: boolean;
  fetchNextPage: () => Promise<{ hasNextPage?: boolean }>;
  onConsumed: () => void;
};

export function ReplyFromSearchEffect({
  replyToCommentId,
  enabled,
  isLoading,
  isFetchingNextPage,
  comments,
  hasNextPage,
  fetchNextPage,
  onConsumed,
}: ReplyFromSearchEffectProps) {
  const { setReplyTo } = useReplyContext();
  const { scrollTo } = useScrollToComment({ fetchNextPage, hasNextPage });
  const consumedRef = useRef(false);

  useEffect(() => {
    if (
      !enabled ||
      !replyToCommentId ||
      consumedRef.current ||
      isLoading ||
      isFetchingNextPage
    ) {
      return;
    }

    const comment = comments.find(entry => entry.id === replyToCommentId);
    if (comment) {
      consumedRef.current = true;
      setReplyTo(comment);
      void scrollTo(replyToCommentId).then(() => {
        document
          .getElementById('discussion-comment-input')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      queueMicrotask(() => onConsumed());
      return;
    }

    if (hasNextPage) {
      void fetchNextPage();
      return;
    }

    consumedRef.current = true;
    onConsumed();
  }, [
    comments,
    enabled,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    onConsumed,
    replyToCommentId,
    scrollTo,
    setReplyTo,
  ]);

  return null;
}
