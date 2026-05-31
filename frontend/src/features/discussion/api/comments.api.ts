import { api } from '@/shared/api/http';

import type {
  CommentDto,
  CreateCommentParams,
  DiscussionEntityType,
  FetchCommentsParams,
  PaginatedCommentsResponse,
  UpdateCommentPayload,
} from './comments-api.types';

export const COMMENTS_PAGE_SIZE = 20;

function getEndpointPrefix(entityType: DiscussionEntityType): string {
  return entityType === 'IDEA' ? 'ideas' : 'problems';
}

export async function fetchComments({
  entityType,
  entityId,
  page,
  limit = COMMENTS_PAGE_SIZE,
  sort,
}: FetchCommentsParams): Promise<PaginatedCommentsResponse> {
  const { data } = await api.get<PaginatedCommentsResponse>(
    `/${getEndpointPrefix(entityType)}/${entityId}/comments`,
    { params: { page, limit, sort } },
  );
  return data;
}

export async function createComment({
  entityType,
  entityId,
  payload,
}: CreateCommentParams): Promise<CommentDto> {
  const formData = new FormData();

  const content = payload.content?.trim() ?? '';
  if (content.length > 0) {
    formData.append('content', content);
  }

  if (payload.parentId) {
    formData.append('parentId', payload.parentId);
  }

  for (const file of payload.attachments ?? []) {
    formData.append('files', file);
  }

  const { data } = await api.post<CommentDto>(
    `/${getEndpointPrefix(entityType)}/${entityId}/comments`,
    formData,
  );

  return data;
}

export async function toggleCommentLike(commentId: string): Promise<void> {
  await api.post(`/comments/${commentId}/like`);
}

export async function updateComment(
  commentId: string,
  payload: UpdateCommentPayload,
): Promise<CommentDto> {
  const formData = new FormData();
  formData.append('content', payload.content.trim());

  for (const attachmentId of payload.deletedAttachmentIds ?? []) {
    formData.append('deletedAttachmentIds', attachmentId);
  }

  for (const file of payload.newAttachments ?? []) {
    formData.append('files', file);
  }

  const { data } = await api.patch<CommentDto>(
    `/comments/${commentId}`,
    formData,
  );
  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}

export type {
  CommentAttachmentDto,
  CommentAuthorDto,
  CommentDto,
  CommentParentQuoteDto,
  CommentSort,
  CreateCommentPayload,
  DiscussionEntityType,
  PaginatedCommentsMeta,
  PaginatedCommentsResponse,
  UpdateCommentPayload,
} from './comments-api.types';
