'use client';

import type {
  CommentDto,
  DiscussionEntityType,
} from '@/features/discussion/api/comments-api.types';
import { useCreateCommentMutation } from '@/features/discussion/hooks/use-create-comment-mutation';
import {
  COMMENT_ATTACHMENT_ACCEPT,
  COMMENT_ATTACHMENT_ALLOWED_MESSAGE,
  COMMENT_ATTACHMENT_MIME_TYPES,
  MAX_COMMENT_ATTACHMENTS,
} from '@/features/discussion/lib/comment-attachments.constants';
import { useDiscussionUiStore } from '@/features/discussion/model/discussion-ui-store';
import { useReplyContext } from '@/features/discussion/ui/reply-context';
import { getAttachmentFileKey } from '@/features/ideas/lib/create-idea/attachments';
import { IdeaAttachmentCard } from '@/features/ideas/ui/create-idea/IdeaAttachmentCard';
import { useBlocker } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

import { useFileHandler } from '@/shared/hooks/use-file-handler';
import { MessageComposer } from '@/shared/ui/message-composer';

import { QuotedReplyPreview } from './QuotedReplyBlock';

const MAX_CHARS = 5000;

function toParentQuote(comment: CommentDto) {
  return {
    id: comment.id,
    content: comment.content,
    author: comment.author,
    createdAt: comment.createdAt,
  };
}

type CommentInputAreaProps = {
  entityType: DiscussionEntityType;
  entityId: string;
  className?: string;
};

export function CommentInputArea({
  entityType,
  entityId,
  className,
}: CommentInputAreaProps) {
  const { replyTo, clearReply, setReplyTo } = useReplyContext();
  const [content, setContent] = useState('');

  const [cachedQuote, setCachedQuote] = useState<ReturnType<
    typeof toParentQuote
  > | null>(null);

  if (replyTo && cachedQuote?.id !== replyTo.id) {
    setCachedQuote(toParentQuote(replyTo));
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate } = useCreateCommentMutation(entityType, entityId);

  const {
    files,
    handleFileChange,
    removeFile,
    clearFiles,
    atLimit,
    accept,
    addFiles,
  } = useFileHandler({
    maxFiles: MAX_COMMENT_ATTACHMENTS,
    allowedMimeTypes: [...COMMENT_ATTACHMENT_MIME_TYPES],
    accept: COMMENT_ATTACHMENT_ACCEPT,
    allowedMessage: COMMENT_ATTACHMENT_ALLOWED_MESSAGE,
  });

  const editingCommentId = useDiscussionUiStore(s => s.editingCommentId);
  const setDraftDirty = useDiscussionUiStore(s => s.setDraftDirty);

  const isCurrentlyEditing = editingCommentId !== null;

  const trimmedContent = content.trim();
  const contentLength = trimmedContent.length;
  const hasFiles = files.length > 0;
  const isOverLimit = contentLength > MAX_CHARS;

  const canSubmit = (contentLength > 0 || hasFiles) && !isOverLimit;
  const hasUnsavedDraft = contentLength > 0 || hasFiles;

  useBlocker({
    shouldBlockFn: () => false,
    enableBeforeUnload: () => hasUnsavedDraft,
  });

  useEffect(() => {
    const isDirty = contentLength > 0 || hasFiles;
    setDraftDirty(isDirty);
    return () => setDraftDirty(false);
  }, [contentLength, hasFiles, setDraftDirty]);

  const resetInput = useCallback(() => {
    setContent('');
    clearFiles();
    clearReply();
    setCachedQuote(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearFiles, clearReply]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    const payloadContent = trimmedContent;
    const payloadParentId = replyTo?.id;
    const payloadAttachments = [...files];
    const payloadReplyTo = replyTo;

    resetInput();

    mutate(
      {
        content: payloadContent,
        parentId: payloadParentId,
        attachments:
          payloadAttachments.length > 0 ? payloadAttachments : undefined,
      },
      {
        onError: () => {
          setContent(prev =>
            prev ? `${prev}\n\n${payloadContent}` : payloadContent,
          );
          if (payloadAttachments.length > 0) {
            addFiles(payloadAttachments);
          }
          if (payloadReplyTo && setReplyTo) {
            setReplyTo(payloadReplyTo);
          }
        },
      },
    );
  };

  const handleQuoteClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }

      if (!replyTo?.id) return;

      const targetComment = document.getElementById(`comment-${replyTo.id}`);

      if (targetComment) {
        targetComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetComment.setAttribute('data-highlighted', 'true');
        setTimeout(() => {
          targetComment.removeAttribute('data-highlighted');
        }, 600);
      }
    },
    [replyTo],
  );

  const parentQuote = replyTo ? toParentQuote(replyTo) : null;
  const displayQuote = parentQuote || cachedQuote;

  return (
    <MessageComposer
      content={content}
      onContentChange={setContent}
      onSubmit={handleSubmit}
      canSubmit={canSubmit}
      disabled={isCurrentlyEditing}
      placeholder={
        isCurrentlyEditing
          ? 'Finish editing to type a new message...'
          : 'Type your message...'
      }
      inputId="discussion-comment-input"
      className={className}
      attachDisabled={isCurrentlyEditing || atLimit}
      onAttachClick={() => fileInputRef.current?.click()}
      fileInputRef={fileInputRef}
      accept={accept}
      onFileChange={handleFileChange}
      isOverLimit={isOverLimit}
      overLimitBanner={
        isOverLimit ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 absolute -top-10 right-0 z-20 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm">
            Character limit exceeded ({contentLength} / {MAX_CHARS})
          </div>
        ) : undefined
      }
      quotePreview={
        displayQuote ? (
          <div
            onClick={handleQuoteClick}
            role="button"
            tabIndex={0}
            className="cursor-pointer"
          >
            <QuotedReplyPreview
              quote={displayQuote}
              onCancel={() => {
                clearReply();
                setCachedQuote(null);
              }}
              className="w-full"
            />
          </div>
        ) : undefined
      }
      attachmentsPreview={
        files.length > 0
          ? files.map(file => {
              const key = getAttachmentFileKey(file);
              return (
                <IdeaAttachmentCard
                  key={key}
                  file={file}
                  allFiles={files}
                  disabled={false}
                  onRemove={() => removeFile(key)}
                />
              );
            })
          : undefined
      }
    />
  );
}
