import { Prisma } from '../../generated/prisma/client';
import {
  PARENT_QUOTE_CONTENT_MAX_LENGTH,
  commentListInclude,
} from './comment.constants';
import type {
  CommentAttachmentDto,
  CommentAuthorDto,
  CommentDto,
  CommentParentQuoteDto,
} from './types/comment.types';

export type CommentRecord = Prisma.CommentGetPayload<{
  include: ReturnType<typeof commentListInclude>;
}>;

type AuthorRecord = CommentRecord['author'];
type ParentRecord = NonNullable<CommentRecord['parent']>;
type MediaRecord = CommentRecord['media'][number];

function toIsoString(date: Date): string {
  return date.toISOString();
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, maxLength).trimEnd()}…`;
}

export function toCommentAuthorResponse(
  author: AuthorRecord,
): CommentAuthorDto {
  return {
    id: author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    avatarUrl: author.avatarUrl,
  };
}

function toCommentParentQuoteResponse(
  parent: ParentRecord,
): CommentParentQuoteDto {
  return {
    id: parent.id,
    content: truncateContent(parent.content, PARENT_QUOTE_CONTENT_MAX_LENGTH),
    author: toCommentAuthorResponse(parent.author),
    createdAt: toIsoString(parent.createdAt),
  };
}

function toCommentAttachmentResponse(media: MediaRecord): CommentAttachmentDto {
  return {
    id: media.id,
    url: media.url,
    mimeType: media.mimeType,
    originalFilename: media.originalFilename,
  };
}

export function toCommentResponse(comment: CommentRecord): CommentDto {
  return {
    id: comment.id,
    content: comment.content,
    author: toCommentAuthorResponse(comment.author),
    parent: comment.parent
      ? toCommentParentQuoteResponse(comment.parent)
      : null,
    attachments: (comment.media ?? []).map(toCommentAttachmentResponse),
    likeCount: comment._count?.likes ?? 0,
    isLiked: (comment.likes?.length ?? 0) > 0,
    createdAt: toIsoString(comment.createdAt),
  };
}
