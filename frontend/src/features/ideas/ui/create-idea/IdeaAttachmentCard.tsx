import fileImageSvg from '@/assets/svg/file-image.svg';
import {
  getAttachmentFileKey,
  isImageAttachment,
} from '@/features/ideas/lib/create-idea/attachments';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';

import DeleteImageButton from './DeleteImageButton';

type IdeaAttachmentCardProps = {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
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
}: IdeaAttachmentCardProps) {
  const isImage = isImageAttachment(file);

  return (
    <div
      className={cn(
        'flex w-20 flex-col items-center gap-1.5',
        disabled && 'opacity-60',
      )}
      title={file.name}
    >
      <div className="relative size-20 shrink-0">
        <div className="border-brand-gray-200 size-full overflow-hidden rounded-md border bg-white">
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
        </div>
        <DeleteImageButton
          variant="compact"
          onClick={onRemove}
          isBusy={disabled}
          aria-label="Remove file"
        />
      </div>
      <span className="text-foreground line-clamp-2 w-full text-center text-xs leading-tight">
        {file.name}
      </span>
    </div>
  );
}
