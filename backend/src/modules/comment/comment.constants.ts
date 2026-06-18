import { Prisma } from '../../../generated/prisma/client';

export const IDEA_NOT_FOUND = 'Idea not found';
export const PROBLEM_NOT_FOUND = 'Problem not found';
export const COMMENT_NOT_FOUND = 'Comment not found';
export const COMMENT_FORBIDDEN =
  'You can only edit or delete your own comments';
export const PARENT_COMMENT_NOT_FOUND = 'Parent comment not found';
export const PARENT_COMMENT_ENTITY_MISMATCH =
  'Parent comment does not belong to this entity';

export const COMMENT_CONTENT_MAX_LENGTH = 5000;
export const PARENT_QUOTE_CONTENT_MAX_LENGTH = 200;
export const MAX_COMMENT_ATTACHMENTS = 5;

export const ALLOWED_COMMENT_ATTACHMENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const COMMENT_AUTHOR_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export function commentListInclude(userId: string) {
  return {
    author: { select: COMMENT_AUTHOR_SELECT },
    parent: {
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: COMMENT_AUTHOR_SELECT },
      },
    },
    media: {
      select: {
        id: true,
        url: true,
        mimeType: true,
        originalFilename: true,
      },
      orderBy: { createdAt: 'asc' },
    },
    likes: {
      where: { userId },
      select: { userId: true },
    },
    _count: {
      select: { likes: true },
    },
  } satisfies Prisma.CommentInclude;
}

export function commentDetailInclude(userId: string) {
  return commentListInclude(userId);
}
