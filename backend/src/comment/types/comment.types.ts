export type CommentAuthorDto = {
  id: string;
  email: string;
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
