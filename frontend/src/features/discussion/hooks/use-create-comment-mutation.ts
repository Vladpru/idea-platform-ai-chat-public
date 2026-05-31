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
  snapshotCommentInfiniteQuery,
  restoreCommentInfiniteQuery,
  type CommentInfiniteQueriesSnapshot,
} from '@/features/discussion/lib/sync-comment-mutation-cache';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';

type CreateCommentMutationContext = {
  previousData?: CommentInfiniteQueriesSnapshot;
  optimisticAttachments?: CommentAttachmentDto[];
};

function appendCommentToInfiniteData(
  data: InfiniteData<PaginatedCommentsResponse>,
  comment: CommentDto,
): InfiniteData<PaginatedCommentsResponse> {
  if (data.pages.length === 0) {
    return {
      ...data,
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
    };
  }

  const lastIndex = data.pages.length - 1;

  return {
    ...data,
    pages: data.pages.map((page, index) => {
      if (index !== lastIndex) {
        return page;
      }

      return {
        ...page,
        data: [...page.data, comment],
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
  content: string;
  parentQuote: CommentDto['parent'];
  attachments: CommentAttachmentDto[];
  author: NonNullable<ReturnType<typeof useAuthSessionStore.getState>['user']>;
}): CommentDto {
  return {
    id: `temp-${crypto.randomUUID()}`,
    content: params.content,
    author: {
      id: params.author.id,
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

      const optimisticAttachments = buildOptimisticAttachments(
        payload.attachments,
      );

      const optimisticComment = buildOptimisticComment({
        content: payload.content?.trim() ?? '',
        parentQuote,
        attachments: optimisticAttachments,
        author: user,
      });

      queryClient.setQueriesData<InfiniteData<PaginatedCommentsResponse>>(
        { queryKey: entityQueryKey },
        old =>
          old
            ? appendCommentToInfiniteData(old, optimisticComment)
            : {
                pages: [
                  {
                    data: [optimisticComment],
                    meta: {
                      total: 1,
                      page: 1,
                      limit: 20,
                      totalPages: 1,
                      hasNextPage: false,
                    },
                  },
                ],
                pageParams: [1],
              },
      );

      return { previousData, optimisticAttachments };
    },
    onError: (_error, _variables, context) => {
      toast.error('Could not post comment');
      restoreCommentInfiniteQuery(
        queryClient,
        entityType,
        entityId,
        context?.previousData,
      );
    },
    onSettled: (_data, _error, _variables, context) => {
      context?.optimisticAttachments?.forEach(att =>
        URL.revokeObjectURL(att.url),
      );

      void queryClient.invalidateQueries({ queryKey: entityQueryKey });

      if (entityType === 'IDEA') {
        void queryClient.invalidateQueries({
          queryKey: ideaMutationKeys.detail(entityId),
        });
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: problemMutationKeys.detail(entityId),
      });
    },
  });
}
