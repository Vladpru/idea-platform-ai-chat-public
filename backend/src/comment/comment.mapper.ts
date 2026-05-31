import {
  COMMENT_AUTHOR_SELECT,
  PARENT_QUOTE_CONTENT_MAX_LENGTH,
} from './comment.constants';
import type {
  CommentAttachmentDto,
  CommentAuthorDto,
  CommentDto,
  CommentParentQuoteDto,
} from './types/comment.types';

type CommentAuthorRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

type UserLikeRecord = { userId: string };

type CommentParentRecord = {
  id: string;
  content: string;
  createdAt: Date;
  author: CommentAuthorRecord;
};

type CommentMediaRecord = {
  id: string;
  url: string;
  mimeType: string;
  originalFilename: string;
};

export type CommentRecord = {
  id: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  author: CommentAuthorRecord;
  parent: CommentParentRecord | null;
  likes?: UserLikeRecord[];
  media?: CommentMediaRecord[];
};

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
  author: CommentAuthorRecord,
): CommentAuthorDto {
  return {
    id: author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    avatarUrl: author.avatarUrl,
  };
}

function toCommentParentQuoteResponse(
  parent: CommentParentRecord,
): CommentParentQuoteDto {
  return {
    id: parent.id,
    content: truncateContent(parent.content, PARENT_QUOTE_CONTENT_MAX_LENGTH),
    author: toCommentAuthorResponse(parent.author),
    createdAt: toIsoString(parent.createdAt),
  };
}

function mapUserIsLiked(likes: UserLikeRecord[] | undefined): boolean {
  return (likes?.length ?? 0) > 0;
}

function toCommentAttachmentResponse(
  media: CommentMediaRecord,
): CommentAttachmentDto {
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
    likeCount: comment.likeCount ?? 0,
    isLiked: mapUserIsLiked(comment.likes),
    createdAt: toIsoString(comment.createdAt),
  };
}

export type { CommentAuthorRecord };
