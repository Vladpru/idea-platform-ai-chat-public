'use client';

import type { CommentDto } from '@/features/discussion/api/comments-api.types';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ReplyContextValue = {
  replyTo: CommentDto | null;
  setReplyTo: (comment: CommentDto | null) => void;
  clearReply: () => void;
};

const ReplyContext = createContext<ReplyContextValue | null>(null);

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

export function useReplyContext(): ReplyContextValue {
  const context = useContext(ReplyContext);
  if (!context) {
    throw new Error('useReplyContext must be used within ReplyProvider');
  }
  return context;
}
