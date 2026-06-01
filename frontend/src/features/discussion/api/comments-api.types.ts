export type CommentAuthorDto = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type CommentParentQuoteDto = {
  id: string;
  content: string;
  author: CommentAuthorDto;
  createdAt: string;
};

export type CommentAttachmentDto = {
  id: string;
  url: string;
  mimeType: string;
  originalFilename: string;
};

export type CommentDto = {
  id: string;
  content: string;
  author: CommentAuthorDto;
  parent: CommentParentQuoteDto | null;
  attachments: CommentAttachmentDto[];
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  isClientError?: boolean;
  retryPayload?: CreateCommentPayload;
};

export type PaginatedCommentsMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type PaginatedCommentsResponse = {
  data: CommentDto[];
  meta: PaginatedCommentsMeta;
};

export type DiscussionEntityType = 'IDEA' | 'PROBLEM';

export type CommentSort = 'newest' | 'oldest';

export type FetchCommentsParams = {
  entityType: DiscussionEntityType;
  entityId: string;
  page: number;
  limit?: number;
  sort?: CommentSort;
};

export type CreateCommentPayload = {
  content?: string;
  parentId?: string;
  attachments?: File[];
};

export type CreateCommentParams = {
  entityType: DiscussionEntityType;
  entityId: string;
  payload: CreateCommentPayload;
};

export type UpdateCommentPayload = {
  content: string;
  newAttachments?: File[];
  deletedAttachmentIds?: string[];
};
