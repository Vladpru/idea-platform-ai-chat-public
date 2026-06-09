import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';

export type DiscussionEntityKind = 'IDEA' | 'PROBLEM';

export function toLiveChatEntityType(
  entityKind: DiscussionEntityKind,
): LiveChatEntityType {
  return entityKind === 'IDEA' ? 'ideas' : 'problems';
}

export function liveChatEntityLabel(entityType: LiveChatEntityType): string {
  return entityType === 'ideas' ? 'Idea' : 'Problem';
}

export function liveChatEntityDetailPath(
  entityType: LiveChatEntityType,
  entityId: string,
): string {
  return entityType === 'ideas' ? `/ideas/${entityId}` : `/problems/${entityId}`;
}
