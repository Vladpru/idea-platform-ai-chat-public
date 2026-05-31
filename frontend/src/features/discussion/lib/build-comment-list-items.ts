import type { CommentDto } from '@/features/discussion/api/comments-api.types';
import { formatDiscussionDateLabel, getCommentDayKey } from '@/features/discussion/lib/format-discussion-date';

export type CommentDateListItem = {
  type: 'date';
  label: string;
  key: string;
};

export type CommentRowListItem = {
  type: 'comment';
  comment: CommentDto;
  key: string;
};

export type CommentListItem = CommentDateListItem | CommentRowListItem;

export function buildCommentListItems(comments: CommentDto[]): CommentListItem[] {
  const items: CommentListItem[] = [];
  let previousDayKey: string | null = null;

  for (const comment of comments) {
    const dayKey = getCommentDayKey(comment.createdAt);

    if (dayKey !== previousDayKey) {
      items.push({
        type: 'date',
        label: formatDiscussionDateLabel(comment.createdAt),
        key: `date-${dayKey}`,
      });
      previousDayKey = dayKey;
    }

    items.push({
      type: 'comment',
      comment,
      key: `comment-${comment.id}`,
    });
  }

  return items;
}
