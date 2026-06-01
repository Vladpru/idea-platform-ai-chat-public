import type {
  CommentSort,
  DiscussionEntityType,
} from '@/features/discussion/api/comments-api.types';

export const commentQueryKeys = {
  all: ['comments'] as const,
  entity: (entityType: DiscussionEntityType, entityId: string) =>
    [...commentQueryKeys.all, entityType, entityId] as const,
  infinite: (
    entityType: DiscussionEntityType,
    entityId: string,
    sort: CommentSort,
  ) =>
    [...commentQueryKeys.entity(entityType, entityId), 'infinite', sort] as const,
};
