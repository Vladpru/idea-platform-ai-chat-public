'use client';

import fileImageSvg from '@/assets/svg/file-image.svg';
import type { CommentAttachmentDto } from '@/features/discussion/api/comments-api.types';

import { cn } from '@/shared/lib/utils';

type CommentAttachmentPreviewProps = {
  attachment: CommentAttachmentDto;
  className?: string;
  onImageClick?: () => void;
};

export function CommentAttachmentPreview({
  attachment,
  className,
  onImageClick,
}: CommentAttachmentPreviewProps) {
  const isImage =
    attachment.mimeType?.startsWith('image/') ||
    /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(
      attachment.originalFilename,
    );

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex w-20 flex-col items-center gap-1.5 transition-opacity hover:opacity-90',
        className,
      )}
      title={attachment.originalFilename}
      onClick={
        isImage && onImageClick
          ? event => {
              event.preventDefault();
              onImageClick();
            }
          : undefined
      }
    >
      <div className="border-brand-gray-200 size-20 shrink-0 overflow-hidden rounded-md border bg-white">
        {isImage ? (
          <img
            src={attachment.url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <img
              src={fileImageSvg}
              alt=""
              className="size-11 shrink-0"
              aria-hidden
            />
          </div>
        )}
      </div>
      <span className="text-foreground line-clamp-2 w-full text-center text-xs leading-tight">
        {attachment.originalFilename}
      </span>
    </a>
  );
}
