'use client';

import { useBlocker } from '@tanstack/react-router';
import { Paperclip } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type {
  CommentDto,
  DiscussionEntityType,
} from '@/features/discussion/api/comments-api.types';
import {
  revokeCommentAttachmentObjectUrls,
  useCreateCommentMutation,
} from '@/features/discussion/hooks/use-create-comment-mutation';
import { useDeleteCommentMutation } from '@/features/discussion/hooks/use-delete-comment-mutation';
import { useUpdateCommentMutation } from '@/features/discussion/hooks/use-update-comment-mutation';
import { removeCommentFromCache } from '@/features/discussion/lib/sync-comment-mutation-cache';
import {
  COMMENT_ATTACHMENT_ACCEPT,
  COMMENT_ATTACHMENT_ALLOWED_MESSAGE,
  COMMENT_ATTACHMENT_MIME_TYPES,
  MAX_COMMENT_ATTACHMENTS,
} from '@/features/discussion/lib/comment-attachments.constants';
import { formatCommentTime } from '@/features/discussion/lib/format-discussion-date';
import { scheduleHighlightDirtyComment } from '@/features/discussion/lib/highlight-dirty-comment';
import { CommentAttachmentPreview } from '@/features/discussion/ui/CommentAttachmentPreview';
import { CommentItemActions } from '@/features/discussion/ui/CommentItemActions';
import { CommentLikeButton } from '@/features/discussion/ui/CommentLikeButton';

import { useDiscussionUiStore } from '@/features/discussion/model/discussion-ui-store';
import { useReplyContext } from '@/features/discussion/ui/reply-context';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { getAttachmentFileKey } from '@/features/ideas/lib/create-idea/attachments';
import DeleteImageButton from '@/features/ideas/ui/create-idea/DeleteImageButton';
import { IdeaAttachmentCard } from '@/features/ideas/ui/create-idea/IdeaAttachmentCard';
import { useFileHandler } from '@/shared/hooks/use-file-handler';
import {
  formatUserDisplayName,
  getAuthorInitials,
} from '@/shared/lib/user-display';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import { ImageLightbox } from '@/shared/ui/image-lightbox';
import { cn } from '@/shared/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { QuotedReplyBlock } from './QuotedReplyBlock';

type CommentItemProps = {
  comment: CommentDto;
  entityType: DiscussionEntityType;
  entityId: string;
  onQuoteClick?: (commentId: string) => void;
};

function FooterActionButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'text-brand-dark-blue inline-flex text-xs font-bold tracking-wide uppercase transition-colors',
        'hover:text-brand-dark-blue/80 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function CommentItem({
  comment,
  entityType,
  entityId,
  onQuoteClick,
}: CommentItemProps) {
  const queryClient = useQueryClient();
  const { setReplyTo } = useReplyContext();
  const currentUserId = useAuthSessionStore(s => s.user?.id);
  const isAuthor = Boolean(
    currentUserId && comment.author.id === currentUserId,
  );
  const isClientError = Boolean(comment.isClientError);

  const createMutation = useCreateCommentMutation(entityType, entityId);
  const deleteMutation = useDeleteCommentMutation(entityType, entityId);
  const updateMutation = useUpdateCommentMutation(entityType, entityId);

  const editingCommentId = useDiscussionUiStore(s => s.editingCommentId);
  const isEditingDirty = useDiscussionUiStore(s => s.isEditingDirty);
  const isDraftDirty = useDiscussionUiStore(s => s.isDraftDirty);
  const startEditing = useDiscussionUiStore(s => s.startEditing);
  const setEditingDirty = useDiscussionUiStore(s => s.setEditingDirty);
  const stopEditing = useDiscussionUiStore(s => s.stopEditing);
  const discardAllUnsaved = useDiscussionUiStore(s => s.discardAllUnsaved);

  const isEditing = editingCommentId === comment.id;

  const [editContent, setEditContent] = useState(comment.content);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>(
    [],
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showCrossEditModal, setShowCrossEditModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [navigationBlockConfirmed, setNavigationBlockConfirmed] =
    useState(false);

  const navigationBlockedHandledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authorName = formatUserDisplayName({
    firstName: comment.author.firstName,
    lastName: comment.author.lastName,
    email: null,
  });

  const visibleExistingAttachments = useMemo(
    () =>
      comment.attachments.filter(
        attachment => !deletedAttachmentIds.includes(attachment.id),
      ),
    [comment.attachments, deletedAttachmentIds],
  );

  const imageAttachments = useMemo(
    () =>
      comment.attachments.filter(
        attachment =>
          attachment.mimeType?.startsWith('image/') ||
          /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(
            attachment.originalFilename,
          ),
      ),
    [comment.attachments],
  );

  const maxNewAttachments = Math.max(
    0,
    MAX_COMMENT_ATTACHMENTS - visibleExistingAttachments.length,
  );

  const {
    files: newAttachments,
    handleFileChange,
    removeFile,
    clearFiles,
    atLimit,
    accept,
  } = useFileHandler({
    maxFiles: maxNewAttachments,
    allowedMimeTypes: [...COMMENT_ATTACHMENT_MIME_TYPES],
    accept: COMMENT_ATTACHMENT_ACCEPT,
    allowedMessage: COMMENT_ATTACHMENT_ALLOWED_MESSAGE,
  });

  const resetEditState = useCallback(() => {
    setEditContent(comment.content);
    setDeletedAttachmentIds([]);
    clearFiles();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [comment.content, clearFiles]);

  const handleStartEdit = useCallback(() => {
    const shouldBlock =
      isDraftDirty ||
      (editingCommentId !== null &&
        editingCommentId !== comment.id &&
        isEditingDirty);

    if (shouldBlock) {
      const targetId = isDraftDirty
        ? 'discussion-comment-input'
        : `comment-${editingCommentId}`;
      const element = document.getElementById(targetId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (element) {
        element.setAttribute('data-highlighted', 'true');
        setTimeout(() => {
          element.removeAttribute('data-highlighted');
        }, 600);
      }
      setShowCrossEditModal(true);
      return;
    }

    resetEditState();
    startEditing(comment.id);
  }, [
    editingCommentId,
    comment.id,
    isDraftDirty,
    isEditingDirty,
    resetEditState,
    startEditing,
  ]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editContent.trim();
    const hasAttachmentChanges =
      deletedAttachmentIds.length > 0 || newAttachments.length > 0;
    const hasContentChange = trimmed !== comment.content.trim();
    const hasChanges = hasContentChange || hasAttachmentChanges;

    if (!hasChanges) {
      stopEditing();
      resetEditState();
      return;
    }

    if (
      trimmed.length === 0 &&
      visibleExistingAttachments.length === 0 &&
      newAttachments.length === 0
    ) {
      return;
    }

    updateMutation.mutate(
      {
        commentId: comment.id,
        payload: {
          content: trimmed,
          newAttachments,
          deletedAttachmentIds,
        },
      },
      {
        onSuccess: () => {
          stopEditing();
          resetEditState();
        },
      },
    );
  }, [
    comment.content,
    comment.id,
    deletedAttachmentIds,
    editContent,
    newAttachments,
    resetEditState,
    updateMutation,
    visibleExistingAttachments.length,
    stopEditing,
  ]);

  const handleConfirmDelete = useCallback(() => {
    deleteMutation.mutate(comment.id, {
      onSuccess: () => setDeleteModalOpen(false),
    });
  }, [comment.id, deleteMutation]);

  const handleRetryFailedComment = useCallback(() => {
    if (!comment.retryPayload) {
      return;
    }

    createMutation.mutate(comment.retryPayload);
  }, [comment.retryPayload, createMutation]);

  const handleDiscardFailedComment = useCallback(() => {
    revokeCommentAttachmentObjectUrls(comment.attachments);
    removeCommentFromCache(queryClient, entityType, entityId, comment.id);
  }, [comment.attachments, comment.id, entityId, entityType, queryClient]);

  const isMutating =
    deleteMutation.isPending ||
    updateMutation.isPending ||
    createMutation.isPending;
  const trimmedEditContent = editContent.trim();
  const canSave =
    (trimmedEditContent.length > 0 ||
      visibleExistingAttachments.length > 0 ||
      newAttachments.length > 0) &&
    !updateMutation.isPending;

  const hasAttachments =
    !isEditing &&
    Array.isArray(comment.attachments) &&
    comment.attachments.length > 0;

  const isDirty =
    isEditing &&
    (trimmedEditContent !== comment.content.trim() ||
      deletedAttachmentIds.length > 0 ||
      newAttachments.length > 0);

  useEffect(() => {
    if (isEditing) {
      setEditingDirty(isDirty);
    } else {
      setEditingDirty(false);
    }
  }, [isEditing, isDirty, setEditingDirty]);

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => isDirty,
    withResolver: true,
  });

  const navigationBlockModalOpen =
    status === 'blocked' && navigationBlockConfirmed;

  useEffect(() => {
    if (status !== 'blocked') {
      navigationBlockedHandledRef.current = false;
      return;
    }

    if (navigationBlockedHandledRef.current) {
      return;
    }
    navigationBlockedHandledRef.current = true;

    return scheduleHighlightDirtyComment(() => {
      setNavigationBlockConfirmed(true);
    });
  }, [status]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isEditing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        resetEditState();
        stopEditing();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditing, resetEditState, stopEditing]);

  return (
    <>
      <article
        id={`comment-${comment.id}`}
        className={cn(
          'data-[highlighted=true]:!bg-brand-dark-blue/10 bg-card mb-4 rounded-lg border p-5 shadow-sm transition-colors duration-500',
          isClientError ? 'border-red-200 bg-red-50/40' : 'border-gray-200',
        )}
        aria-label={`Comment by ${authorName}`}
      >
        <header className="flex gap-3">
          <Avatar size="default" className="shrink-0">
            {comment.author.avatarUrl ? (
              <AvatarImage src={comment.author.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-brand-gray-100 text-brand-gray-700 text-xs font-semibold">
              {getAuthorInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-brand-black text-sm font-semibold">
              {authorName}
            </p>
            <time
              dateTime={comment.createdAt}
              className="text-sm text-gray-400 tabular-nums"
            >
              {formatCommentTime(comment.createdAt)}
            </time>
          </div>
        </header>

        <div className={cn('mt-3', isClientError && 'opacity-60')}>
          {comment.parent ? (
            <QuotedReplyBlock
              quote={comment.parent}
              onQuoteClick={onQuoteClick}
              className="bg-brand-neutral"
            />
          ) : null}

          {isEditing ? (
            <div className="mt-2 space-y-3">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                disabled={updateMutation.isPending}
                className="border-brand-gray-200 text-brand-gray-800 focus:border-brand-dark-blue focus:ring-brand-dark-blue/20 bg-card w-full resize-y rounded-md border px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:outline-none disabled:opacity-50"
                aria-label="Edit comment"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {visibleExistingAttachments.map(attachment => {
                  const isImage =
                    attachment.mimeType?.startsWith('image/') ||
                    /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(
                      attachment.originalFilename,
                    );
                  const imageIndex = isImage
                    ? imageAttachments.findIndex(
                        item => item.id === attachment.id,
                      )
                    : -1;

                  return (
                    <div
                      key={attachment.id}
                      className="relative size-20 shrink-0"
                    >
                      <CommentAttachmentPreview
                        attachment={attachment}
                        className="pointer-events-none w-20"
                        onImageClick={
                          imageIndex >= 0
                            ? () => setLightboxIndex(imageIndex)
                            : undefined
                        }
                      />
                      <DeleteImageButton
                        variant="compact"
                        onClick={() =>
                          setDeletedAttachmentIds(prev =>
                            prev.includes(attachment.id)
                              ? prev
                              : [...prev, attachment.id],
                          )
                        }
                        isBusy={updateMutation.isPending}
                      />
                    </div>
                  );
                })}
                {newAttachments.map(file => {
                  const key = getAttachmentFileKey(file);
                  return (
                    <IdeaAttachmentCard
                      key={key}
                      file={file}
                      allFiles={newAttachments}
                      disabled={updateMutation.isPending}
                      onRemove={() => removeFile(key)}
                    />
                  );
                })}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={accept}
                  className="hidden"
                  disabled={updateMutation.isPending || atLimit}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="text-brand-gray-500 hover:text-brand-dark-blue bg-card flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Attach file"
                  disabled={updateMutation.isPending || atLimit}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-4 shrink-0" aria-hidden />
                </button>
              </div>
            </div>
          ) : comment.content ? (
            <p className="text-brand-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          ) : null}

          {hasAttachments ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {comment.attachments.map(attachment => {
                const isImage =
                  attachment.mimeType?.startsWith('image/') ||
                  /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(
                    attachment.originalFilename,
                  );
                const imageIndex = isImage
                  ? imageAttachments.findIndex(
                      item => item.id === attachment.id,
                    )
                  : -1;

                return (
                  <CommentAttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    onImageClick={
                      imageIndex >= 0
                        ? () => setLightboxIndex(imageIndex)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          ) : null}
        </div>

        <footer className="mt-4 flex items-center justify-end gap-6">
          {isClientError ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:justify-end">
              <p className="text-sm font-medium text-red-600">Failed to send</p>
              <div className="flex flex-wrap items-center gap-4">
                <FooterActionButton
                  onClick={handleRetryFailedComment}
                  disabled={isMutating || !comment.retryPayload}
                  className="cursor-pointer text-red-700"
                >
                  Retry
                </FooterActionButton>
                <FooterActionButton
                  onClick={handleDiscardFailedComment}
                  disabled={isMutating}
                  className="cursor-pointer text-red-700"
                >
                  Delete
                </FooterActionButton>
              </div>
            </div>
          ) : (
            <>
              {isAuthor ? (
                isEditing ? (
                  <div className="flex items-center gap-4">
                    <FooterActionButton
                      onClick={() => {
                        resetEditState();
                        stopEditing();
                      }}
                      className="cursor-pointer text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </FooterActionButton>
                    <FooterActionButton
                      onClick={handleSaveEdit}
                      disabled={!canSave}
                      className="cursor-pointer"
                    >
                      Save
                    </FooterActionButton>
                  </div>
                ) : (
                  <CommentItemActions
                    isMutating={isMutating}
                    onEdit={handleStartEdit}
                    onDelete={() => setDeleteModalOpen(true)}
                  />
                )
              ) : null}
              <FooterActionButton
                onClick={() => setReplyTo(comment)}
                disabled={isMutating || isEditing}
                className="cursor-pointer"
              >
                REPLY
              </FooterActionButton>
              <CommentLikeButton
                commentId={comment.id}
                entityType={entityType}
                entityId={entityId}
                isLiked={comment.isLiked}
                likeCount={comment.likeCount}
              />
            </>
          )}
        </footer>
      </article>

      <ConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete comment?"
        description="This comment will be permanently removed from the discussion."
        confirmLabel="YES"
        cancelLabel="NO"
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />

      <ConfirmModal
        open={showCrossEditModal}
        onOpenChange={setShowCrossEditModal}
        title="Discard unsaved changes?"
        description="You have unsaved changes in a draft or another comment. Discard them to edit this one?"
        confirmLabel="DISCARD"
        cancelLabel="STAY"
        onConfirm={() => {
          discardAllUnsaved();
          resetEditState();
          startEditing(comment.id);
          setShowCrossEditModal(false);
        }}
      />

      <ConfirmModal
        open={navigationBlockModalOpen}
        onOpenChange={open => {
          if (!open) {
            reset?.();
            setNavigationBlockConfirmed(false);
          }
        }}
        title="Discard unsaved changes?"
        description="You are trying to leave. Any unsaved edits will be lost."
        confirmLabel="DISCARD"
        cancelLabel="STAY"
        onConfirm={() => {
          proceed?.();
          setNavigationBlockConfirmed(false);
        }}
      />

      {lightboxIndex !== null && imageAttachments.length > 0 ? (
        <ImageLightbox
          images={imageAttachments.map(attachment => ({
            url: attachment.url,
            alt: attachment.originalFilename,
          }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </>
  );
}
