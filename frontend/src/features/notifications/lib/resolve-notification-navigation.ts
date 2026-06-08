import type { DiscussionSearch } from '@/features/discussion/lib/discussion-search';

import type { NotificationPayload } from '../api/notifications.types';

function readString(payload: NotificationPayload, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

type DiscussionReplySearch = Pick<DiscussionSearch, 'tab' | 'replyTo'>;

export type NotificationNavigationTarget =
  | {
      to: '/ideas/$ideaId';
      params: { ideaId: string };
      search?: DiscussionReplySearch;
    }
  | {
      to: '/problems/$problemId';
      params: { problemId: string };
      search?: DiscussionReplySearch;
    };

function ideaTarget(
  ideaId: string,
  search?: DiscussionReplySearch,
): NotificationNavigationTarget {
  return { to: '/ideas/$ideaId', params: { ideaId }, search };
}

function problemTarget(
  problemId: string,
  search?: DiscussionReplySearch,
): NotificationNavigationTarget {
  return { to: '/problems/$problemId', params: { problemId }, search };
}

function discussionReplySearch(commentId: string): DiscussionReplySearch {
  return { tab: 'discussion', replyTo: commentId };
}

export function resolveNotificationNavigationTarget(
  type: string,
  payload: NotificationPayload,
): NotificationNavigationTarget | null {
  const ideaId = readString(payload, 'ideaId');
  const problemId = readString(payload, 'problemId');
  const entityType = readString(payload, 'entityType');
  const entityId = readString(payload, 'entityId');
  const matchedEntityId = readString(payload, 'matchedEntityId');

  if (type === 'idea.status.changed' && ideaId) {
    return ideaTarget(ideaId);
  }

  if (type === 'problem.status.changed' && problemId) {
    return problemTarget(problemId);
  }

  if (type === 'similar.idea.detected' && matchedEntityId) {
    return ideaTarget(matchedEntityId);
  }

  if (type === 'similar.problem.detected' && matchedEntityId) {
    return problemTarget(matchedEntityId);
  }

  if (type === 'comment.created') {
    const commentId = readString(payload, 'commentId');
    if (entityType === 'idea' && entityId) {
      return ideaTarget(
        entityId,
        commentId ? discussionReplySearch(commentId) : undefined,
      );
    }
    if (entityType === 'problem' && entityId) {
      return problemTarget(
        entityId,
        commentId ? discussionReplySearch(commentId) : undefined,
      );
    }
  }

  if (entityType === 'idea' && entityId) {
    return ideaTarget(entityId);
  }

  if (entityType === 'problem' && entityId) {
    return problemTarget(entityId);
  }

  if (ideaId) {
    return ideaTarget(ideaId);
  }

  if (problemId) {
    return problemTarget(problemId);
  }

  return null;
}
