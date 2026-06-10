import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';

export type DiscussionEntityKind = 'IDEA' | 'PROBLEM';

export function toLiveChatEntityType(
  entityKind: DiscussionEntityKind,
): LiveChatEntityType {
  return entityKind === 'IDEA' ? 'ideas' : 'problems';
}

export function liveChatEntityLabel(entityType: LiveChatEntityType): string {
  if (entityType === 'ideas') {
    return 'Idea';
  }

  if (entityType === 'problems') {
    return 'Problem';
  }

  return 'Direct';
}

export function liveChatEntityDetailPath(
  entityType: LiveChatEntityType,
  entityId: string,
): string {
  if (entityType === 'ideas') {
    return `/ideas/${entityId}`;
  }

  if (entityType === 'problems') {
    return `/problems/${entityId}`;
  }

  return `/profile/${entityId}`;
}
