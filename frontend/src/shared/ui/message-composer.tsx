'use client';

import { Loader2, Paperclip, Send } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { cn } from '@/shared/lib/utils';

export type MessageComposerProps = {
  content: string;
  onContentChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  canSubmit: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputId: string;
  className?: string;
  showAttachButton?: boolean;
  attachDisabled?: boolean;
  isAttachLoading?: boolean;
  onAttachClick?: () => void;
  fileInputRef?: RefObject<HTMLInputElement | null>;
  accept?: string;
  onFileChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  quotePreview?: ReactNode;
  attachmentsPreview?: ReactNode;
  overLimitBanner?: ReactNode;
  isOverLimit?: boolean;
};

export function MessageComposer({
  content,
  onContentChange,
  onSubmit,
  canSubmit,
  disabled = false,
  placeholder = 'Type your message...',
  inputId,
  className,
  showAttachButton = true,
  attachDisabled = false,
  isAttachLoading = false,
  onAttachClick,
  fileInputRef,
  accept,
  onFileChange,
  quotePreview,
  attachmentsPreview,
  overLimitBanner,
  isOverLimit = false,
}: MessageComposerProps) {
  const [isFloating, setIsFloating] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;

    element.style.height = '0px';
    const currentScrollHeight = element.scrollHeight;

    element.style.height = `${Math.min(Math.max(currentScrollHeight, 40), 120)}px`;
  }, []);

  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || disabled) {
      return;
    }

    await onSubmit();
    focusTextarea();
  }, [canSubmit, disabled, focusTextarea, onSubmit]);

  useLayoutEffect(() => {
    adjustTextareaHeight();
  }, [content, isFloating, adjustTextareaHeight]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '100px 0px 0px 0px',
      },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className={cn('sticky bottom-4 z-10 mt-6 w-full', className)}>
        {quotePreview ? (
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              'mb-3 grid-rows-[1fr] opacity-100',
              isFloating ? 'mx-auto max-w-4xl' : 'w-full',
            )}
          >
            <div className="overflow-hidden">{quotePreview}</div>
          </div>
        ) : null}

        {attachmentsPreview ? (
          <div
            className={cn(
              'mb-3 flex flex-wrap items-start gap-3 transition-all duration-300 ease-in-out',
              isFloating ? 'mx-auto max-w-4xl' : 'w-full',
            )}
          >
            {attachmentsPreview}
          </div>
        ) : null}

        <div
          className={cn(
            'relative flex min-w-0 items-end',
            isFloating ? 'mx-auto max-w-4xl gap-3' : 'w-full gap-2 p-2',
          )}
        >
          {overLimitBanner}

          <div
            className={cn(
              'bg-card absolute inset-0 rounded-lg border shadow-sm transition-all duration-500',
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

          {showAttachButton && fileInputRef && accept && onFileChange ? (
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              disabled={disabled || attachDisabled}
              onChange={onFileChange}
            />
          ) : null}

          {showAttachButton ? (
            <button
              type="button"
              className={cn(
                'relative z-10 flex shrink-0 cursor-pointer items-center justify-center border transition-all duration-300',
                isFloating
                  ? 'bg-card size-[52px] rounded-full border-gray-200 shadow-sm hover:bg-gray-50'
                  : 'size-10 rounded-md border-transparent bg-transparent shadow-none hover:bg-gray-100',
                'text-gray-400 hover:text-gray-600 disabled:opacity-50',
              )}
              aria-label="Attach file"
              disabled={disabled || attachDisabled || isAttachLoading}
              onClick={onAttachClick}
            >
              {isAttachLoading ? (
                <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Paperclip className="size-5 shrink-0" aria-hidden />
              )}
            </button>
          ) : null}

          <div
            className={cn(
              'relative z-10 flex min-w-0 flex-1 items-end border transition-colors duration-200',
              isFloating
                ? 'bg-card rounded-[28px] px-5 shadow-sm'
                : 'rounded-md border-transparent bg-transparent px-2 shadow-none',
              isFloating
                ? isOverLimit
                  ? 'border-red-400'
                  : 'border-gray-200'
                : 'border-transparent',
            )}
          >
            <label className="sr-only" htmlFor={inputId}>
              Type your message
            </label>
            <textarea
              ref={textareaRef}
              id={inputId}
              value={content}
              rows={1}
              disabled={disabled}
              placeholder={placeholder}
              className={cn(
                'max-h-[120px] min-h-[40px] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent text-sm leading-[20px] placeholder:text-gray-400',
                'focus-visible:ring-0 focus-visible:outline-none disabled:opacity-60',
                'data-[highlighted=true]:ring-brand-dark-blue/30 transition-shadow duration-500 data-[highlighted=true]:ring-2',
                isFloating ? 'py-4 pr-2' : 'py-[10px]',
                isOverLimit ? 'text-red-600' : 'text-brand-gray-800',
              )}
              onChange={event => onContentChange(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

          <button
            type="button"
            disabled={!canSubmit || disabled}
            onMouseDown={event => event.preventDefault()}
            onClick={() => void handleSubmit()}
            className={cn(
              'relative z-10 flex shrink-0 cursor-pointer items-center justify-center border transition-all duration-300',
              isFloating
                ? 'bg-card size-[52px] rounded-full border-gray-200 shadow-sm hover:bg-gray-50'
                : 'size-10 rounded-md border-transparent bg-transparent shadow-none hover:bg-gray-100',
              canSubmit
                ? 'text-brand-dark-blue'
                : 'cursor-not-allowed text-gray-300',
            )}
            aria-label="Send message"
          >
            <Send className="size-5 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
    </>
  );
}
