import { createContext, useContext } from 'react';

import type { CommentDto } from '@/features/discussion/api/comments-api.types';

export type ReplyContextValue = {
  replyTo: CommentDto | null;
  setReplyTo: (comment: CommentDto | null) => void;
  clearReply: () => void;
};

export const ReplyContext = createContext<ReplyContextValue | null>(null);

export function useReplyContext(): ReplyContextValue {
  const context = useContext(ReplyContext);
  if (!context) {
    throw new Error('useReplyContext must be used within ReplyProvider');
  }
  return context;
}
