import fileImageSvg from '@/assets/svg/file-image.svg';
import {
  getAttachmentFileKey,
  isImageAttachment,
} from '@/features/ideas/lib/create-idea/attachments';
import { useEffect, useState } from 'react';

import { useAttachmentFileLightbox } from '@/shared/hooks/use-attachment-file-lightbox';
import { cn } from '@/shared/lib/utils';
import { ImageLightbox } from '@/shared/ui/image-lightbox';

import DeleteImageButton from './DeleteImageButton';

type IdeaAttachmentCardProps = {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
  /** All files in the field — enables multi-image lightbox navigation */
  allFiles?: File[];
};

function AttachmentImagePreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return <img src={url} alt="" className="size-full object-cover" />;
}

export function IdeaAttachmentCard({
  file,
  onRemove,
  disabled = false,
  allFiles,
}: IdeaAttachmentCardProps) {
  const isImage = isImageAttachment(file);
  const filesForPreview = allFiles ?? [file];
  const { openFile, closeLightbox, lightbox } =
    useAttachmentFileLightbox(filesForPreview);

  return (
    <>
      <div
        className={cn(
          'flex w-20 flex-col items-center gap-1.5',
          disabled && 'opacity-60',
        )}
        title={file.name}
      >
        <div className="relative size-20 shrink-0">
          <button
            type="button"
            className="border-brand-gray-200 bg-card size-full cursor-pointer overflow-hidden rounded-md border transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onClick={() => openFile(file)}
            aria-label={isImage ? `Preview ${file.name}` : `Open ${file.name}`}
          >
            {isImage ? (
              <AttachmentImagePreview
                key={getAttachmentFileKey(file)}
                file={file}
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
          </button>
          <DeleteImageButton
            variant="compact"
            onClick={event => {
              event.stopPropagation();
              onRemove();
            }}
            isBusy={disabled}
            aria-label="Remove file"
          />
        </div>
        <button
          type="button"
          className="text-foreground line-clamp-2 w-full cursor-pointer text-center text-xs leading-tight hover:underline focus-visible:underline focus-visible:outline-none"
          onClick={() => openFile(file)}
          aria-label={isImage ? `Preview ${file.name}` : `Open ${file.name}`}
        >
          {file.name}
        </button>
      </div>

      {lightbox ? (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.initialIndex}
          onClose={closeLightbox}
        />
      ) : null}
    </>
  );
}
