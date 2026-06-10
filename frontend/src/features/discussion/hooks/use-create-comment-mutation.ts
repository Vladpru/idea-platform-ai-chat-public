import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  COMMENTS_PAGE_SIZE,
  createComment,
  type CreateCommentPayload,
} from '@/features/discussion/api/comments.api';
import type {
  CommentAttachmentDto,
  CommentDto,
  DiscussionEntityType,
  PaginatedCommentsResponse,
} from '@/features/discussion/api/comments-api.types';
import { commentQueryKeys } from '@/features/discussion/hooks/comment-query-keys';
import {
  adjustEntityDiscussionCountInCache,
  snapshotCommentInfiniteQuery,
  type CommentInfiniteQueriesSnapshot,
} from '@/features/discussion/lib/sync-comment-mutation-cache';
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';

type CreateCommentMutationContext = {
  previousData?: CommentInfiniteQueriesSnapshot;
  optimisticAttachments?: CommentAttachmentDto[];
  optimisticCommentId?: string;
};

function prependCommentToInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  comment: CommentDto,
): InfiniteData<PaginatedCommentsResponse> {
  if (!data || data.pages.length === 0) {
    return {
      pages: [
        {
          data: [comment],
          meta: {
            total: 1,
            page: 1,
            limit: COMMENTS_PAGE_SIZE,
            totalPages: 1,
            hasNextPage: false,
          },
        },
      ],
      pageParams: [1],
    };
  }

  return {
    ...data,
    pages: data.pages.map((page, index) => {
      if (index !== 0) {
        return page;
      }

      return {
        ...page,
        data: [comment, ...page.data],
        meta: {
          ...page.meta,
          total: page.meta.total + 1,
        },
      };
    }),
  };
}

function findCommentInInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  commentId: string,
): CommentDto | undefined {
  for (const page of data.pages) {
    const match = page.data.find(comment => comment.id === commentId);
    if (match) {
      return match;
    }
  }
  return undefined;
}

function createCommentPayloadsMatch(
  a: CreateCommentPayload | undefined,
  b: CreateCommentPayload,
): boolean {
  if (!a) {
    return false;
  }

  if ((a.content?.trim() ?? '') !== (b.content?.trim() ?? '')) {
    return false;
  }

  if (a.parentId !== b.parentId) {
    return false;
  }

  const aFiles = a.attachments ?? [];
  const bFiles = b.attachments ?? [];

  if (aFiles.length !== bFiles.length) {
    return false;
  }

  return aFiles.every(
    (file, index) =>
      file === bFiles[index] ||
      (file.name === bFiles[index].name && file.size === bFiles[index].size),
  );
}

function findRetryableFailedComment(
  data: InfiniteData<PaginatedCommentsResponse>,
  payload: CreateCommentPayload,
): CommentDto | undefined {
  const failedComments = data.pages.flatMap(page =>
    page.data.filter(comment => comment.isClientError),
  );

  if (failedComments.length === 0) {
    return undefined;
  }

  if (failedComments.length === 1) {
    return failedComments[0];
  }

  return failedComments.find(comment =>
    createCommentPayloadsMatch(comment.retryPayload, payload),
  );
}

function replaceCommentInInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  commentId: string,
  comment: CommentDto,
): InfiniteData<PaginatedCommentsResponse> {
  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      data: page.data.map(existing =>
        existing.id === commentId ? comment : existing,
      ),
    })),
  };
}

function markOptimisticCommentFailedInInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  commentId: string,
  retryPayload: CreateCommentPayload,
): InfiniteData<PaginatedCommentsResponse> {
  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      data: page.data.map(comment =>
        comment.id === commentId
          ? { ...comment, isClientError: true, retryPayload }
          : comment,
      ),
    })),
  };
}

export function revokeCommentAttachmentObjectUrls(
  attachments: CommentAttachmentDto[],
): void {
  attachments.forEach(attachment => {
    if (attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
  });
}

function toParentQuoteFromComment(comment: CommentDto): CommentDto['parent'] {
  return {
    id: comment.id,
    content: comment.content,
    author: comment.author,
    createdAt: comment.createdAt,
  };
}

function buildOptimisticAttachments(
  files: File[] | undefined,
): CommentAttachmentDto[] {
  if (!files?.length) {
    return [];
  }

  return files.map(file => ({
    id: `temp-attachment-${crypto.randomUUID()}`,
    url: URL.createObjectURL(file),
    mimeType: file.type,
    originalFilename: file.name,
  }));
}

function buildOptimisticComment(params: {
  id: string;
  content: string;
  parentQuote: CommentDto['parent'];
  attachments: CommentAttachmentDto[];
  author: NonNullable<ReturnType<typeof useAuthSessionStore.getState>['user']>;
}): CommentDto {
  return {
    id: params.id,
    content: params.content,
    author: {
      id: params.author.id,
      email: params.author.email,
      firstName: params.author.firstName || null,
      lastName: params.author.lastName || null,
      avatarUrl: params.author.picture,
    },
    parent: params.parentQuote,
    attachments: params.attachments,
    likeCount: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
  };
}

export function useCreateCommentMutation(
  entityType: DiscussionEntityType,
  entityId: string,
) {
  const queryClient = useQueryClient();
  const entityQueryKey = commentQueryKeys.entity(entityType, entityId);

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      createComment({ entityType, entityId, payload }),
    onMutate: async (payload): Promise<CreateCommentMutationContext> => {
      await queryClient.cancelQueries({ queryKey: entityQueryKey });

      const previousData = snapshotCommentInfiniteQuery(
        queryClient,
        entityType,
        entityId,
      );
      const user = useAuthSessionStore.getState().user;

      if (!user) {
        return { previousData };
      }

      const activeInfiniteData = previousData[0]?.[1];
      let parentQuote: CommentDto['parent'] = null;

      if (payload.parentId && activeInfiniteData) {
        const parentComment = findCommentInInfiniteData(
          activeInfiniteData,
          payload.parentId,
        );
        if (parentComment) {
          parentQuote = toParentQuoteFromComment(parentComment);
        }
      }

      const retryableFailed =
        activeInfiniteData &&
        findRetryableFailedComment(activeInfiniteData, payload);

      const optimisticAttachments = buildOptimisticAttachments(
        payload.attachments,
      );
      const optimisticCommentId =
        retryableFailed?.id ?? `temp-${crypto.randomUUID()}`;

      if (retryableFailed) {
        revokeCommentAttachmentObjectUrls(retryableFailed.attachments);
      }

      const optimisticComment = buildOptimisticComment({
        id: optimisticCommentId,
        content: payload.content?.trim() ?? '',
        parentQuote,
        attachments: optimisticAttachments,
        author: user,
      });

      queryClient.setQueriesData<InfiniteData<PaginatedCommentsResponse>>(
        { queryKey: entityQueryKey },
        old => {
          if (!old) {
            return {
              pages: [
                {
                  data: [optimisticComment],
                  meta: {
                    total: 1,
                    page: 1,
                    limit: COMMENTS_PAGE_SIZE,
                    totalPages: 1,
                    hasNextPage: false,
                  },
                },
              ],
              pageParams: [1],
            };
          }

          if (retryableFailed) {
            return replaceCommentInInfiniteData(
              old,
              optimisticCommentId,
              optimisticComment,
            );
          }

          return prependCommentToInfiniteData(old, optimisticComment);
        },
      );

      return { previousData, optimisticAttachments, optimisticCommentId };
    },
    onSuccess: (realComment, _variables, context) => {
      queryClient.setQueriesData<InfiniteData<PaginatedCommentsResponse>>(
        { queryKey: entityQueryKey },
        old => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(c =>
                c.id === context?.optimisticCommentId ? realComment : c,
              ),
            })),
          };
        },
      );

      context?.optimisticAttachments?.forEach(att =>
        URL.revokeObjectURL(att.url),
      );

      adjustEntityDiscussionCountInCache(queryClient, entityType, entityId, 1);
    },
    onError: (_error, variables, context) => {
      toast.error('Could not post comment');

      if (!context?.optimisticCommentId) {
        return;
      }

      queryClient.setQueriesData<InfiniteData<PaginatedCommentsResponse>>(
        { queryKey: entityQueryKey },
        old =>
          old
            ? markOptimisticCommentFailedInInfiniteData(
                old,
                context.optimisticCommentId!,
                variables,
              )
            : old,
      );
    },
  });
}
