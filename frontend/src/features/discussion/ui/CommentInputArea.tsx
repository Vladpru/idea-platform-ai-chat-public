'use client';

import { Paperclip, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

import type {
  CommentDto,
  DiscussionEntityType,
} from '@/features/discussion/api/comments-api.types';
import {
  COMMENT_ATTACHMENT_ACCEPT,
  COMMENT_ATTACHMENT_ALLOWED_MESSAGE,
  COMMENT_ATTACHMENT_MIME_TYPES,
  MAX_COMMENT_ATTACHMENTS,
} from '@/features/discussion/lib/comment-attachments.constants';
import { useCreateCommentMutation } from '@/features/discussion/hooks/use-create-comment-mutation';
import { useDiscussionUiStore } from '@/features/discussion/model/discussion-ui-store';
import { QuotedReplyBlock } from '@/features/discussion/ui/QuotedReplyBlock';
import { useReplyContext } from '@/features/discussion/ui/reply-context';
import { getAttachmentFileKey } from '@/features/ideas/lib/create-idea/attachments';
import { IdeaAttachmentCard } from '@/features/ideas/ui/create-idea/IdeaAttachmentCard';
import { useFileHandler } from '@/shared/hooks/use-file-handler';
import { cn } from '@/shared/lib/utils';

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
  const { replyTo, clearReply } = useReplyContext();
  const [content, setContent] = useState('');
  const [isFloating, setIsFloating] = useState(true);

  const [cachedQuote, setCachedQuote] = useState<ReturnType<
    typeof toParentQuote
  > | null>(null);

  if (replyTo && cachedQuote?.id !== replyTo.id) {
    setCachedQuote(toParentQuote(replyTo));
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending } = useCreateCommentMutation(entityType, entityId);

  const { files, handleFileChange, removeFile, clearFiles, atLimit, accept } =
    useFileHandler({
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

  const canSubmit =
    (contentLength > 0 || hasFiles) && !isPending && !isOverLimit;

  useEffect(() => {
    const isDirty = contentLength > 0 || hasFiles;
    setDraftDirty(isDirty);
    return () => setDraftDirty(false);
  }, [contentLength, hasFiles, setDraftDirty]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '16px',
      },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const adjustTextareaHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  }, []);

  const resetInput = useCallback(() => {
    setContent('');
    clearFiles();
    clearReply();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearFiles, clearReply]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    mutate(
      {
        content: trimmedContent,
        parentId: replyTo?.id,
        attachments: files.length > 0 ? files : undefined,
      },
      {
        onSuccess: resetInput,
        onError: resetInput,
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
    <>
      <div className={cn('sticky bottom-4 z-10 mt-6 w-full', className)}>
        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            parentQuote
              ? 'mb-3 grid-rows-[1fr] opacity-100'
              : 'mb-0 grid-rows-[0fr] opacity-0',
            isFloating ? 'mx-auto max-w-4xl' : 'w-full',
          )}
        >
          <div className="overflow-hidden">
            {displayQuote ? (
              <div
                onClick={handleQuoteClick}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
              >
                <QuotedReplyBlock
                  quote={displayQuote}
                  variant="input-preview"
                  onCancel={clearReply}
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
        </div>

        {files.length > 0 ? (
          <div
            className={cn(
              'mb-3 flex flex-wrap items-start gap-3 transition-all duration-500 ease-in-out',
              isFloating ? 'mx-auto max-w-4xl' : 'w-full',
            )}
          >
            {files.map(file => {
              const key = getAttachmentFileKey(file);
              return (
                <IdeaAttachmentCard
                  key={key}
                  file={file}
                  disabled={isPending}
                  onRemove={() => removeFile(key)}
                />
              );
            })}
          </div>
        ) : null}

        <div
          className={cn(
            'relative flex items-end transition-all duration-500 ease-in-out',
            isFloating ? 'mx-auto max-w-4xl gap-3' : 'w-full gap-2 p-2',
          )}
        >
          {isOverLimit && (
            <div className="animate-in fade-in slide-in-from-bottom-2 absolute -top-10 right-0 z-20 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm">
              Character limit exceeded ({contentLength} / {MAX_CHARS})
            </div>
          )}

          <div
            className={cn(
              'absolute inset-0 rounded-lg border bg-white shadow-sm transition-all duration-500',
              isFloating
                ? 'pointer-events-none border-transparent opacity-0'
                : 'opacity-100',
              !isFloating
                ? isOverLimit
                  ? 'border-red-400'
                  : 'border-gray-200'
                : '',
            )}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            disabled={isPending || isCurrentlyEditing || atLimit}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className={cn(
              'relative z-10 flex shrink-0 cursor-pointer items-center justify-center border transition-all duration-500 ease-in-out',
              isFloating
                ? 'size-[52px] rounded-full border-gray-200 bg-white shadow-sm hover:bg-gray-50'
                : 'size-10 rounded-md border-transparent bg-transparent shadow-none hover:bg-gray-100',
              'text-gray-400 hover:text-gray-600 disabled:opacity-50',
            )}
            aria-label="Attach file"
            disabled={isPending || isCurrentlyEditing || atLimit}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-5 shrink-0" aria-hidden />
          </button>

          <div
            className={cn(
              'relative z-10 flex flex-1 items-end border transition-all duration-500 ease-in-out',
              isFloating
                ? 'rounded-[28px] bg-white px-5 shadow-sm'
                : 'rounded-md border-transparent bg-transparent px-2 shadow-none',
              isFloating
                ? isOverLimit
                  ? 'border-red-400'
                  : 'border-gray-200'
                : 'border-transparent',
            )}
          >
            <label className="sr-only" htmlFor="discussion-comment-input">
              Type your message
            </label>
            <textarea
              ref={textareaRef}
              id="discussion-comment-input"
              value={content}
              rows={1}
              disabled={isPending || isCurrentlyEditing}
              placeholder={
                isCurrentlyEditing
                  ? 'Finish editing to type a new message...'
                  : 'Type your message...'
              }
              className={cn(
                'max-h-[120px] min-w-0 flex-1 resize-none border-0 bg-transparent text-sm placeholder:text-gray-400',
                'focus-visible:ring-0 focus-visible:outline-none disabled:opacity-60',
                'data-[highlighted=true]:ring-brand-dark-blue/30 transition-shadow duration-500 data-[highlighted=true]:ring-2',
                isFloating ? 'py-4 pr-2' : 'py-2.5',
                isOverLimit ? 'text-red-600' : 'text-brand-gray-800',
              )}
              onChange={event => {
                setContent(event.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <button
            type="button"
            disabled={!canSubmit || isCurrentlyEditing}
            onClick={handleSubmit}
            className={cn(
              'relative z-10 flex shrink-0 cursor-pointer items-center justify-center border transition-all duration-500 ease-in-out',
              isFloating
                ? 'size-[52px] rounded-full border-gray-200 bg-white shadow-sm hover:bg-gray-50'
                : 'size-10 rounded-md border-transparent bg-transparent shadow-none hover:bg-gray-100',
              canSubmit
                ? 'text-brand-dark-blue'
                : 'cursor-not-allowed text-gray-300',
            )}
            aria-label={isPending ? 'Sending message' : 'Send message'}
          >
            <Send className="size-5 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
    </>
  );
}
