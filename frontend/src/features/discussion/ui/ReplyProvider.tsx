'use client';

import { useMemo, useState, type ReactNode } from 'react';

import type { CommentDto } from '@/features/discussion/api/comments-api.types';
import { ReplyContext, type ReplyContextValue } from './reply-context';

type ReplyProviderProps = {
  children: ReactNode;
};

export function ReplyProvider({ children }: ReplyProviderProps) {
  const [replyTo, setReplyTo] = useState<CommentDto | null>(null);

  const value = useMemo<ReplyContextValue>(
    () => ({
      replyTo,
      setReplyTo,
      clearReply: () => setReplyTo(null),
    }),
    [replyTo],
  );

  return (
    <ReplyContext.Provider value={value}>{children}</ReplyContext.Provider>
  );
}
